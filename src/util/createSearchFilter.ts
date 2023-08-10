// Adaptation of Sanity's createSearchQuery for our limited use case:
// https://github.com/sanity-io/sanity/blob/next/packages/sanity/src/core/search/weighted/createSearchQuery.ts
import {compact, toLower, trim, uniq, words} from 'lodash'

const SPECIAL_CHARS = /([^!@#$%^&*(),\\/?";:{}|[\]+<>\s-])+/g
const STRIP_EDGE_CHARS = /(^[.]+)|([.]+$)/

function tokenize(string: string): string[] {
  return (string.match(SPECIAL_CHARS) || []).map((token) => token.replace(STRIP_EDGE_CHARS, ''))
}

function toGroqParams(terms: string[]): Record<string, string> {
  const params: Record<string, string> = {}
  return terms.reduce((acc, term, i) => {
    acc[`t${i}`] = `${term}*` // "t" is short for term
    return acc
  }, params)
}

/**
 * Convert a string into an array of tokenized terms.
 *
 * Any (multi word) text wrapped in double quotes will be treated as "phrases", or separate tokens that
 * will not have its special characters removed.
 * E.g.`"the" "fantastic mr" fox fox book` =\> ["the", `"fantastic mr"`, "fox", "book"]
 *
 * Phrases wrapped in quotes are assigned relevance scoring differently from regular words.
 *
 * @internal
 */
function extractTermsFromQuery(query: string): string[] {
  const quotedQueries = [] as string[]
  const unquotedQuery = query.replace(/("[^"]*")/g, (match) => {
    if (words(match).length > 1) {
      quotedQueries.push(match)
      return ''
    }
    return match
  })

  // Lowercase and trim quoted queries
  const quotedTerms = quotedQueries.map((str) => trim(toLower(str)))

  /**
   * Convert (remaining) search query into an array of deduped, sanitized tokens.
   * All white space and special characters are removed.
   * e.g. "The saint of Saint-Germain-des-Prés" =\> ['the', 'saint', 'of', 'germain', 'des', 'pres']
   */
  const remainingTerms = uniq(compact(tokenize(toLower(unquotedQuery))))

  return [...quotedTerms, ...remainingTerms]
}

/** Which properties of the video asset document should we match users' queries against */
const SEARCH_PATHS = ['filename']

/**
 * Create GROQ constraints, given search terms and the full spec of available document types and fields.
 * Essentially a large list of all possible fields (joined by logical OR) to match our search terms against.
 */
function createConstraints(terms: string[]) {
  const constraints = terms
    .map((_term, i) => SEARCH_PATHS.map((joinedPath) => `${joinedPath} match $t${i}`))
    .filter((constraint) => constraint.length > 0)

  return constraints.map((constraint) => `(${constraint.join(' || ')})`)
}

export function createSearchFilter(query: string) {
  const terms = extractTermsFromQuery(query)

  return {
    filter: createConstraints(terms),
    params: {
      ...toGroqParams(terms),
    },
  }
}
