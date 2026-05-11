import Link from 'next/link'

interface Props {
  content: string
  className?: string
}

const MENTION_RE = /@([a-zA-Z0-9_]+)/g

/** Renders text with @username transformed into a link to /u/{username}. Preserves whitespace. */
export function MentionText({ content, className }: Props) {
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  MENTION_RE.lastIndex = 0
  while ((match = MENTION_RE.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index))
    }
    parts.push(
      <Link
        key={`m-${match.index}`}
        href={`/u/${match[1]}`}
        className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        @{match[1]}
      </Link>,
    )
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex))
  }
  return <span className={className}>{parts}</span>
}
