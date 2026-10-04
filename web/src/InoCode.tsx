import { useCallback, useState, type ReactNode } from 'react'
import './InoCode.css'

type TokenKind = 'comment' | 'string' | 'number' | 'keyword' | 'type' | 'macro' | 'fn' | 'plain'

const KEYWORDS = new Set([
  'if',
  'else',
  'for',
  'while',
  'do',
  'switch',
  'case',
  'break',
  'continue',
  'return',
  'true',
  'false',
  'nullptr',
  'new',
  'delete',
  'class',
  'struct',
  'public',
  'private',
  'protected',
  'virtual',
  'const',
  'static',
  'void',
  'int',
  'long',
  'short',
  'char',
  'bool',
  'float',
  'double',
  'unsigned',
  'signed',
  'sizeof',
  'typedef',
  'using',
  'namespace',
  'template',
  'typename',
])

const TYPES = new Set([
  'String',
  'MKRIoTCarrier',
  'WiFiClient',
  'WiFiSSLClient',
  'HttpClient',
  'JSONVar',
])

const MACROS = new Set([
  'TOUCH0',
  'TOUCH1',
  'TOUCH2',
  'TOUCH3',
  'TOUCH4',
  'SETUP',
  'LOOP',
  'HIGH',
  'LOW',
  'INPUT',
  'OUTPUT',
  'LED_BUILTIN',
  'ST77XX_BLACK',
  'ST77XX_WHITE',
  'ST77XX_RED',
  'ST77XX_GREEN',
  'ST77XX_YELLOW',
])

function classifyIdent(word: string): TokenKind {
  if (KEYWORDS.has(word)) return 'keyword'
  if (TYPES.has(word)) return 'type'
  if (MACROS.has(word) || /^[A-Z][A-Z0-9_]+$/.test(word)) return 'macro'
  return 'plain'
}

function tokenizeLine(line: string): { kind: TokenKind; text: string }[] {
  const tokens: { kind: TokenKind; text: string }[] = []
  let i = 0

  while (i < line.length) {
    if (line[i] === '/' && line[i + 1] === '/') {
      tokens.push({ kind: 'comment', text: line.slice(i) })
      break
    }

    if (line[i] === '"') {
      let j = i + 1
      while (j < line.length) {
        if (line[j] === '\\') {
          j += 2
          continue
        }
        if (line[j] === '"') {
          j++
          break
        }
        j++
      }
      tokens.push({ kind: 'string', text: line.slice(i, j) })
      i = j
      continue
    }

    if (line[i] === "'") {
      let j = i + 1
      while (j < line.length) {
        if (line[j] === '\\') {
          j += 2
          continue
        }
        if (line[j] === "'") {
          j++
          break
        }
        j++
      }
      tokens.push({ kind: 'string', text: line.slice(i, j) })
      i = j
      continue
    }

    if (line[i] === '#' && (i === 0 || /^\s*$/.test(line.slice(0, i)))) {
      tokens.push({ kind: 'macro', text: line.slice(i) })
      break
    }

    if (/\d/.test(line[i]) && (i === 0 || !/[\w$]/.test(line[i - 1]))) {
      let j = i
      while (j < line.length && /[\d.xXa-fA-F]/.test(line[j])) j++
      tokens.push({ kind: 'number', text: line.slice(i, j) })
      i = j
      continue
    }

    if (/[A-Za-z_]/.test(line[i])) {
      let j = i + 1
      while (j < line.length && /[\w]/.test(line[j])) j++
      const word = line.slice(i, j)
      let k = j
      while (k < line.length && /\s/.test(line[k])) k++
      if (line[k] === '(' && !KEYWORDS.has(word) && !TYPES.has(word) && !MACROS.has(word)) {
        tokens.push({ kind: 'fn', text: word })
      } else {
        tokens.push({ kind: classifyIdent(word), text: word })
      }
      i = j
      continue
    }

    let j = i + 1
    while (
      j < line.length &&
      !/[A-Za-z_0-9"'#]/.test(line[j]) &&
      !(line[j] === '/' && line[j + 1] === '/')
    ) {
      j++
    }
    tokens.push({ kind: 'plain', text: line.slice(i, j) })
    i = j
  }

  return tokens
}

function highlightIno(code: string): ReactNode[] {
  const lines = code.replace(/\r\n/g, '\n').split('\n')
  return lines.map((line, lineIdx) => (
    <span key={lineIdx} className="ino-line">
      {tokenizeLine(line).map((tok, tokIdx) =>
        tok.kind === 'plain' ? (
          <span key={tokIdx}>{tok.text}</span>
        ) : (
          <span key={tokIdx} className={`ino-${tok.kind}`}>
            {tok.text}
          </span>
        ),
      )}
      {lineIdx < lines.length - 1 ? '\n' : null}
    </span>
  ))
}

type InoCodeProps = {
  code: string
  filename?: string
}

export function InoCode({ code, filename = 'controller.ino' }: InoCodeProps) {
  const [copied, setCopied] = useState(false)
  const source = code.trimEnd()

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(source)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      /* clipboard may be blocked */
    }
  }, [source])

  return (
    <figure className="ino-block">
      <figcaption className="ino-filename">
        <span className="ino-filename-text">{filename}</span>
        <button type="button" className="ino-copy" onClick={copy}>
          {copied ? 'COPIED!' : 'COPY'}
        </button>
      </figcaption>
      <pre className="ino-pre">
        <code className="language-ino">{highlightIno(source)}</code>
      </pre>
    </figure>
  )
}
