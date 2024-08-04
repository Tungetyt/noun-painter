import {cn} from '@/lib/utils'
import {
	forwardRef,
	type MutableRefObject,
	type TextareaHTMLAttributes,
	useCallback,
	useEffect,
	useRef
} from 'react'

export interface TextareaProps
	extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
	({className, ...props}, ref) => {
		const textareaRef = useRef<HTMLTextAreaElement | null>(null)

		const handleInput = useCallback(() => {
			if (textareaRef.current) {
				textareaRef.current.style.height = 'auto'
				textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 5}px`
			}
		}, [])

		useEffect(() => {
			if (textareaRef.current) {
				handleInput()
			}
		}, [handleInput])

		return (
			<textarea
				className={cn(
					'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
					className
				)}
				ref={instance => {
					textareaRef.current = instance
					if (typeof ref === 'function') {
						ref(instance)
					} else if (ref) {
						;(ref as MutableRefObject<HTMLTextAreaElement | null>).current =
							instance
					}
				}}
				onInput={handleInput}
				{...props}
			/>
		)
	}
)
Textarea.displayName = 'Textarea'

export {Textarea}
