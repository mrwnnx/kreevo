'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import LinkExtension from '@tiptap/extension-link'
import ImageExtension from '@tiptap/extension-image'
import { Bold, Italic, Link2, Heading2, Heading3, Quote, Image as ImageIcon, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ImageUpload } from '@/components/ui/ImageUpload'

/**
 * BlogEditor — WYSIWYG (Tiptap) à la Medium/Substack. Output = HTML (getHTML()).
 *
 * Robustesse React 19 / Next App Router :
 *  - `immediatelyRender: false` (pas de mismatch d'hydratation).
 *  - Menu de sélection 100% React rendu via createPortal dans <body> → ISOLÉ de
 *    l'arbre DOM que ProseMirror contrôle (on n'utilise PAS le BubbleMenu tippy de
 *    @tiptap/react, qui déplace des nœuds et casse avec React 19).
 *  - ImageUpload toujours monté, masqué en CSS (jamais monté/démonté en sibling de
 *    EditorContent → évite l'erreur insertBefore).
 */

const EDITOR_CLASS = cn(
  // Contenant délimité, esprit Medium : carte claire + colonne centrée
  'mx-auto max-w-[680px] rounded-[24px] border border-border bg-card px-6 py-8 sm:px-8',
  'transition-shadow focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30',
  // Zone éditable : existe visuellement même vide
  '[&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[400px]',
  'text-foreground text-[1.125rem] leading-relaxed',
  '[&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mt-8 [&_h1]:mb-3',
  '[&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-3',
  '[&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2',
  '[&_p]:my-4',
  '[&_strong]:font-semibold [&_em]:italic',
  '[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2',
  '[&_ul]:my-4 [&_ul]:ps-6 [&_ul]:list-disc [&_ul]:space-y-1.5',
  '[&_ol]:my-4 [&_ol]:ps-6 [&_ol]:list-decimal [&_ol]:space-y-1.5',
  '[&_blockquote]:border-s-4 [&_blockquote]:border-primary/40 [&_blockquote]:ps-4 [&_blockquote]:italic [&_blockquote]:text-foreground/80 [&_blockquote]:my-5',
  '[&_pre]:bg-muted [&_pre]:p-4 [&_pre]:rounded-2xl [&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:text-sm',
  '[&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[0.85em]',
  '[&_img]:rounded-[24px] [&_img]:my-6 [&_img]:w-full',
  '[&_hr]:my-8 [&_hr]:border-border',
)

function BubbleBtn({
  active,
  label,
  onClick,
  children,
}: {
  active?: boolean
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      // garde la sélection de l'éditeur quand on clique un bouton du menu
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(active && 'bg-muted text-foreground')}
    >
      {children}
    </Button>
  )
}

type MenuState = { visible: boolean; top: number; left: number }

export function BlogEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const [mounted, setMounted] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [linkEditing, setLinkEditing] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [menu, setMenu] = useState<MenuState>({ visible: false, top: 0, left: 0 })

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Placeholder.configure({
        placeholder: ({ node, pos }) => {
          if (pos === 0) return 'Raconte ton histoire…'
          if (node.type.name === 'heading') return 'Titre'
          return 'Écris ici…'
        },
      }),
      LinkExtension.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: 'noreferrer noopener', target: '_blank' },
      }),
      ImageExtension.configure({ HTMLAttributes: { class: 'rounded-[24px]' } }),
    ],
    content: value || '',
    editorProps: { attributes: { class: 'tiptap' } },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  })

  useEffect(() => setMounted(true), [])

  // Position/visibilité du menu flottant, piloté par la sélection (React only).
  useEffect(() => {
    if (!editor) return
    const update = () => {
      if (linkEditing) return // ne pas recalculer pendant la saisie du lien
      const { empty } = editor.state.selection
      if (empty || !editor.isFocused) {
        setMenu((m) => (m.visible ? { ...m, visible: false } : m))
        return
      }
      const { from, to } = editor.state.selection
      const a = editor.view.coordsAtPos(from)
      const b = editor.view.coordsAtPos(to)
      setMenu({ visible: true, top: Math.min(a.top, b.top), left: (a.left + b.left) / 2 })
    }
    editor.on('selectionUpdate', update)
    editor.on('transaction', update)
    editor.on('focus', update)
    editor.on('blur', update)
    return () => {
      editor.off('selectionUpdate', update)
      editor.off('transaction', update)
      editor.off('focus', update)
      editor.off('blur', update)
    }
  }, [editor, linkEditing])

  function onImageUploaded(url: string | null) {
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run()
      setShowUpload(false)
    }
  }

  function openLink() {
    if (!editor) return
    setLinkUrl((editor.getAttributes('link').href as string) ?? '')
    setLinkEditing(true)
  }

  function applyLink() {
    if (!editor) return
    const url = linkUrl.trim()
    if (url) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    } else {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    }
    setLinkEditing(false)
  }

  return (
    <div className="space-y-3">
      <style>{`
        .tiptap .is-empty::before, .tiptap .is-editor-empty::before {
          content: attr(data-placeholder);
          color: var(--muted-foreground);
          float: left;
          height: 0;
          pointer-events: none;
        }
      `}</style>

      {/* Toolbar minimale — image inline */}
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => setShowUpload((s) => !s)}>
          <ImageIcon className="size-3.5" />
          Image
        </Button>
      </div>

      {/* Toujours monté, masqué en CSS (hors flux ProseMirror) pour éviter insertBefore */}
      <div className={cn(!showUpload && 'hidden')}>
        <ImageUpload bucket="email-banners" value={null} onChange={onImageUploaded} className="aspect-[16/9] max-w-md" />
      </div>

      <EditorContent editor={editor} className={EDITOR_CLASS} />

      {/* Menu de sélection — portail vers <body>, isolé du DOM de l'éditeur */}
      {mounted && editor && menu.visible &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              top: menu.top,
              left: menu.left,
              transform: 'translate(-50%, calc(-100% - 8px))',
              zIndex: 60,
            }}
            className="flex items-center gap-0.5 rounded-2xl border border-border bg-card p-1 shadow-lg shadow-foreground/10"
          >
            {linkEditing ? (
              <div className="flex items-center gap-1 px-1">
                <input
                  autoFocus
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      applyLink()
                    }
                    if (e.key === 'Escape') setLinkEditing(false)
                  }}
                  placeholder="Coller un lien…"
                  className="h-7 w-44 rounded-md border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring"
                />
                <BubbleBtn label="Valider le lien" onClick={applyLink}>
                  <Check className="size-3.5" />
                </BubbleBtn>
                <BubbleBtn label="Annuler" onClick={() => setLinkEditing(false)}>
                  <X className="size-3.5" />
                </BubbleBtn>
              </div>
            ) : (
              <>
                <BubbleBtn label="Gras" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
                  <Bold className="size-3.5" />
                </BubbleBtn>
                <BubbleBtn label="Italique" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
                  <Italic className="size-3.5" />
                </BubbleBtn>
                <BubbleBtn label="Lien" active={editor.isActive('link')} onClick={openLink}>
                  <Link2 className="size-3.5" />
                </BubbleBtn>
                <span className="mx-0.5 h-5 w-px bg-border" />
                <BubbleBtn
                  label="Titre 2"
                  active={editor.isActive('heading', { level: 2 })}
                  onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                >
                  <Heading2 className="size-3.5" />
                </BubbleBtn>
                <BubbleBtn
                  label="Titre 3"
                  active={editor.isActive('heading', { level: 3 })}
                  onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                >
                  <Heading3 className="size-3.5" />
                </BubbleBtn>
                <BubbleBtn label="Citation" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
                  <Quote className="size-3.5" />
                </BubbleBtn>
              </>
            )}
          </div>,
          document.body,
        )}
    </div>
  )
}
