// The only format module that reaches the ISO country database. LxFlag loads it on
// demand so LxTextInput, which imports LxFlag statically for phone prefixes, stays light.
export { formatCountryCode } from '@/utils/countryCodeUtils';
