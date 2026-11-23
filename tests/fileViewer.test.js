import { describe, test, expect, afterEach, beforeEach, vi } from 'vitest';
import { mount, flushPromises, RouterLinkStub } from '@vue/test-utils';
import LxFileViewer from '@/components/FileViewer.vue';
import { logError } from '@/utils/devUtils';

// ---------------------------------------------------------------------------------------------
// General setup
// ---------------------------------------------------------------------------------------------

vi.mock('@/utils/devUtils', async (importOriginal) => ({
  ...(await importOriginal()),
  logError: vi.fn(),
}));

function toDataUrl(mimeType, content) {
  return `data:${mimeType};base64,${btoa(content)}`;
}

let wrapper;

function mountViewer(props = {}) {
  wrapper = mount(LxFileViewer, {
    props: { id: 'viewer', ...props },
    attachTo: document.body,
    global: { stubs: { RouterLink: RouterLinkStub } },
  });
  return wrapper;
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

// happy-dom reports style mutations on the viewer root that browsers don't, which makes the
// viewer's display watcher re-render in an endless loop (seen in PDF scrollable mode)
function MutationObserverStub() {
  return { observe: () => {}, disconnect: () => {}, takeRecords: () => [] };
}

function stubMutationObserver() {
  vi.stubGlobal('MutationObserver', MutationObserverStub);
}

// happy-dom doesn't report intersections; onCreate receives each observer's callback so a test
// can simulate scrolling by calling it with its own entries
function stubIntersectionObserver(onCreate) {
  function IntersectionObserverStub(callback) {
    onCreate(callback);
    return { observe: () => {}, disconnect: () => {} };
  }
  vi.stubGlobal('IntersectionObserver', IntersectionObserverStub);
}

// happy-dom doesn't implement scrolling; returns every scrollTo() call made on the window or an element
function mockScrolling() {
  const windowScroll = vi.spyOn(globalThis, 'scrollTo').mockImplementation(() => {});
  const elementScroll = vi.spyOn(HTMLElement.prototype, 'scrollTo').mockImplementation(() => {});
  return () => [...windowScroll.mock.calls, ...elementScroll.mock.calls];
}

// ---------------------------------------------------------------------------------------------
// PDF setup: pdf.js is replaced with a fake document of PAGE_COUNT pages
// ---------------------------------------------------------------------------------------------

const PAGE_COUNT = 100;

function createPage(renderPromise = Promise.resolve()) {
  return {
    getViewport: () => ({ width: 100, height: 100 }),
    render: () => ({ promise: renderPromise }),
  };
}

// pdf.js answers through its worker, so pages never arrive within the same event loop turn
async function loadPage(renderPromise) {
  await wait(0);
  return createPage(renderPromise);
}

const getPage = vi.fn();

vi.mock('@/utils/libLoader', () => ({
  loadLibrary: vi.fn(async () => ({
    VerbosityLevel: { ERRORS: 0, WARNINGS: 1, INFOS: 5 },
    getDocument: () => ({ promise: Promise.resolve({ numPages: PAGE_COUNT, getPage }) }),
  })),
}));

// Content is irrelevant because pdf.js is mocked; it only has to be valid base64
const pdfFile = toDataUrl('application/pdf', '%PDF-1.4');

function mountPdfViewer(props = {}) {
  return mountViewer({ modelValue: pdfFile, ...props });
}

function pageIndicator() {
  return wrapper.find('.pdf-page-indicator .placeholder').text();
}

// Pages requested from pdf.js; the viewer may re-render, so duplicates are dropped
function renderedPages() {
  return [...new Set(getPage.mock.calls.map(([page]) => page))];
}

// ---------------------------------------------------------------------------------------------

beforeEach(() => {
  getPage.mockReset();
  getPage.mockImplementation(() => loadPage());
  vi.mocked(logError).mockClear();
});

afterEach(() => {
  if (wrapper) {
    wrapper.unmount();
    wrapper = null;
  }
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('LxFileViewer', () => {
  describe('PDF', () => {
    describe('page', () => {
      test('opens the first page by default', async () => {
        mountPdfViewer();

        await vi.waitFor(() => expect(pageIndicator()).toBe(`1 / ${PAGE_COUNT}`));
        expect(renderedPages()).toEqual([1]);
      });

      test('opens the given page', async () => {
        mountPdfViewer({ page: 50 });

        await vi.waitFor(() => expect(pageIndicator()).toBe(`50 / ${PAGE_COUNT}`));
        expect(renderedPages()).toEqual([50]);
      });

      test.each([
        [PAGE_COUNT + 50, PAGE_COUNT],
        [0, 1],
        [-5, 1],
        [Number.NaN, 1],
        [12.7, 12],
      ])('clamps page %s to page %s', async (page, expectedPage) => {
        mountPdfViewer({ page });

        await vi.waitFor(() => expect(pageIndicator()).toBe(`${expectedPage} / ${PAGE_COUNT}`));
        expect(renderedPages()).toEqual([expectedPage]);
      });

      test('applies page again when a new file is loaded', async () => {
        mountPdfViewer({ page: 50 });
        await vi.waitFor(() => expect(pageIndicator()).toBe(`50 / ${PAGE_COUNT}`));

        await wrapper.setProps({
          page: 20,
          modelValue: toDataUrl('application/pdf', '%PDF-1.7'),
        });

        await vi.waitFor(() => expect(pageIndicator()).toBe(`20 / ${PAGE_COUNT}`));
        expect(getPage).toHaveBeenLastCalledWith(20);
      });

      test('scrolls instantly to the given page in scrollable mode', async () => {
        const scrollCalls = mockScrolling();
        stubMutationObserver();

        mountPdfViewer({ page: 50, scrollable: true });

        await vi.waitFor(() => expect(renderedPages()).toHaveLength(PAGE_COUNT));
        await vi.waitFor(() =>
          expect(scrollCalls()).toContainEqual([expect.objectContaining({ behavior: 'instant' })])
        );
        expect(pageIndicator()).toBe(`50 / ${PAGE_COUNT}`);
      });

      test('scrolls to the given page before all pages are drawn in scrollable mode', async () => {
        const scrollCalls = mockScrolling();
        stubMutationObserver();
        // The last page never finishes drawing, so waiting for all pages would never scroll
        getPage.mockImplementation((pageNum) =>
          loadPage(pageNum === PAGE_COUNT ? new Promise(() => {}) : Promise.resolve())
        );

        mountPdfViewer({ page: 3, scrollable: true });

        await vi.waitFor(() =>
          expect(scrollCalls()).toContainEqual([expect.objectContaining({ behavior: 'instant' })])
        );
        expect(pageIndicator()).toBe(`3 / ${PAGE_COUNT}`);
      });

      test('does not scroll on load in scrollable mode by default', async () => {
        const scrollCalls = mockScrolling();
        stubMutationObserver();

        mountPdfViewer({ scrollable: true });

        await vi.waitFor(() => expect(renderedPages()).toHaveLength(PAGE_COUNT));
        // Let the render batch delay elapse so a pending scroll would have run
        await wait(400);
        await flushPromises();

        expect(scrollCalls()).toEqual([]);
        expect(pageIndicator()).toBe(`1 / ${PAGE_COUNT}`);
      });

      test('opens the new page when page changes', async () => {
        mockScrolling();
        mountPdfViewer({ page: 50 });
        await vi.waitFor(() => expect(pageIndicator()).toBe(`50 / ${PAGE_COUNT}`));

        await wrapper.setProps({ page: 20 });

        await vi.waitFor(() => expect(pageIndicator()).toBe(`20 / ${PAGE_COUNT}`));
        expect(getPage).toHaveBeenLastCalledWith(20);
      });

      test('clamps a changed page to the page range', async () => {
        mockScrolling();
        mountPdfViewer({ page: 50 });
        await vi.waitFor(() => expect(pageIndicator()).toBe(`50 / ${PAGE_COUNT}`));

        await wrapper.setProps({ page: PAGE_COUNT + 50 });

        await vi.waitFor(() => expect(pageIndicator()).toBe(`${PAGE_COUNT} / ${PAGE_COUNT}`));
      });

      test('scrolls to the new page when page changes in scrollable mode', async () => {
        const scrollCalls = mockScrolling();
        stubMutationObserver();

        mountPdfViewer({ scrollable: true });
        await vi.waitFor(() => expect(renderedPages()).toHaveLength(PAGE_COUNT));
        getPage.mockClear();

        await wrapper.setProps({ page: 30 });

        await vi.waitFor(() =>
          expect(scrollCalls()).toContainEqual([expect.objectContaining({ behavior: 'smooth' })])
        );
        expect(pageIndicator()).toBe(`30 / ${PAGE_COUNT}`);
        // Pages are already drawn, so navigating must not re-render them
        expect(getPage).not.toHaveBeenCalled();
      });

      test('updates the page indicator on scroll after a file with page 1 replaces one still scrolling to its page', async () => {
        mockScrolling();
        stubMutationObserver();
        // Captures the latest observer so scrolling can be simulated
        let observerCallback = null;
        stubIntersectionObserver((callback) => {
          observerCallback = callback;
        });
        // Slow enough for the file to be replaced before the target page is scrolled into view
        getPage.mockImplementation(() => loadPage(wait(200)));

        mountPdfViewer({ page: 50, scrollable: true });
        await vi.waitFor(() => expect(getPage).toHaveBeenCalled());

        await wrapper.setProps({ page: 1, modelValue: toDataUrl('application/pdf', '%PDF-1.7') });
        await vi.waitFor(() => expect(observerCallback).not.toBeNull(), { timeout: 2000 });

        const canvases = wrapper.findAll('.pdf-canvas').map((c) => c.element);
        observerCallback([
          {
            target: canvases[4],
            isIntersecting: true,
            intersectionRect: { width: 100, height: 100 },
          },
        ]);
        await flushPromises();

        expect(pageIndicator()).toBe(`5 / ${PAGE_COUNT}`);
      });

      test('keeps the current page when scrollable is turned on', async () => {
        const scrollCalls = mockScrolling();
        stubMutationObserver();

        mountPdfViewer({ page: 50 });
        await vi.waitFor(() => expect(pageIndicator()).toBe(`50 / ${PAGE_COUNT}`));

        await wrapper.setProps({ scrollable: true });

        await vi.waitFor(() => expect(renderedPages()).toHaveLength(PAGE_COUNT));
        await vi.waitFor(() =>
          expect(scrollCalls()).toContainEqual([expect.objectContaining({ behavior: 'instant' })])
        );
        expect(pageIndicator()).toBe(`50 / ${PAGE_COUNT}`);
      });

      test('keeps the current page when scrollable is turned off', async () => {
        mockScrolling();
        stubMutationObserver();

        mountPdfViewer({ page: 50, scrollable: true });
        await vi.waitFor(() => expect(renderedPages()).toHaveLength(PAGE_COUNT));
        getPage.mockClear();

        await wrapper.setProps({ scrollable: false });

        await vi.waitFor(() => expect(pageIndicator()).toBe(`50 / ${PAGE_COUNT}`));
        expect(renderedPages()).toEqual([50]);
      });
    });

    describe('file removal', () => {
      test.each([
        ['single page', {}],
        ['scrollable', { scrollable: true }],
        ['scrollable with page', { scrollable: true, page: 50 }],
      ])('does not log errors when the file is removed while rendering (%s)', async (_, props) => {
        mockScrolling();
        stubMutationObserver();
        // Long enough for the file to be removed while pages are still being drawn
        getPage.mockImplementation(() => loadPage(wait(200)));

        mountPdfViewer(props);
        await vi.waitFor(() => expect(getPage).toHaveBeenCalled());

        await wrapper.setProps({ modelValue: null });
        // Let pending page loads and draws settle
        await wait(500);
        await flushPromises();

        expect(logError).not.toHaveBeenCalled();
      });
    });
  });
});
