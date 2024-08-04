'use client'

import type React from 'react'
import {
	useEffect,
	useState,
	useRef,
	useCallback,
	type Dispatch,
	type SetStateAction,
	type FC
} from 'react'
import {Textarea} from './ui/textarea'
import nlp from 'compromise'
import DOMPurify from 'dompurify'
import {Checkbox} from './ui/checkbox'
import {textVide} from 'text-vide'
import {z} from 'zod'
import {Button} from './ui/button'
import {Label} from './ui/label'

const getRandomColor = (usedColors: Set<string>) => {
	let color: string
	do {
		const hue = Math.floor(Math.random() * 361)
		const saturation = 100
		const lightness = 50
		color = `hsl(${hue}, ${saturation}%, ${lightness}%)`
	} while (usedColors.has(color))
	return color
}

const escapeRegExp = (string: string) => {
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // $& means the whole matched string
}

const getNouns = (text: string) => {
	const doc = nlp(text)
	const nounSet = new Set<string>(doc.nouns().out('array'))
	const nouns = Array.from(nounSet)
	return nouns
}

const getHighlightedText = (
	text: string,
	colorDict: Record<string, string>,
	bionicReading: boolean
) => {
	let highlightedText = text

	for (const noun in colorDict) {
		if (Object.prototype.hasOwnProperty.call(colorDict, noun)) {
			const escapedNoun = escapeRegExp(noun)
			// Use a regex that correctly identifies word boundaries including apostrophes
			const regex = new RegExp(`\\b${escapedNoun}\\b`, 'gi')
			highlightedText = highlightedText.replace(
				regex,
				`<span style="color: ${colorDict[noun]};">${noun}</span>`
			)
		}
	}

	// Preserve new lines and tabs by replacing them with their HTML entity equivalents
	highlightedText = highlightedText
		.replace(/\n/g, '<br/>')
		.replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;')

	// Apply Bionic Reading effect using text-vide
	if (bionicReading) {
		highlightedText = textVide(highlightedText)
	}

	return highlightedText
}

const getRepeatedNouns = (text: string) => {
	const nouns = getNouns(text)

	// Count occurrences of each noun
	const nounCounts: Record<string, number> = {}
	for (const noun of nouns) {
		const escapedNoun = escapeRegExp(noun)
		const count = (text.match(new RegExp(`\\b${escapedNoun}\\b`, 'gi')) || [])
			.length
		if (count > 1) {
			nounCounts[noun] = count
		}
	}

	// Assign colors only to repeated nouns if not already assigned
	const repeatedNouns = Object.keys(nounCounts)
	return repeatedNouns
}

const highlightRepeatedNouns = (
	text: string,
	colorDict: {[key: string]: string},
	usedColors: Set<string>,
	bionicReading: boolean
) => {
	const repeatedNouns = getRepeatedNouns(text)
	for (const noun of repeatedNouns) {
		if (!colorDict[noun]) {
			const color = getRandomColor(usedColors)
			colorDict[noun] = color
			usedColors.add(color)
		}
	}

	return getHighlightedText(text, colorDict, bionicReading)
}

const useHandleTextChange = (
	setText: Dispatch<SetStateAction<string>>,
	setHighlightedText: Dispatch<SetStateAction<string>>,
	bionicReading: boolean
) => {
	const colorDict = useRef<Record<string, string>>({})
	const usedColors = useRef<Set<string>>(new Set())

	const handleTextChange = useCallback(
		(newText: string) => {
			setText(newText)
			const rawHtml = highlightRepeatedNouns(
				newText,
				colorDict.current,
				usedColors.current,
				bionicReading
			)
			const sanitizedHtml = DOMPurify.sanitize(rawHtml)
			setHighlightedText(sanitizedHtml)
			localStorage.setItem('highlightedText', newText) // Save text to localStorage
		},
		[setText, setHighlightedText, bionicReading]
	)

	return handleTextChange
}

const useTextChange = (bionicReading: boolean) => {
	const [text, setText] = useState('')
	const [highlightedText, setHighlightedText] = useState('')

	const handleTextChange = useHandleTextChange(
		setText,
		setHighlightedText,
		bionicReading
	)

	return {text, highlightedText, handleTextChange}
}

const useTextareaRef = (text: string) => {
	const textareaRef = useRef<HTMLTextAreaElement | null>(null)

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		if (textareaRef.current) {
			textareaRef.current.style.height = 'auto'
			textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
		}
	}, [text])

	return textareaRef
}

const useSavedText = (handleTextChange: (newText: string) => void) => {
	useEffect(() => {
		const savedText = localStorage.getItem('highlightedText')
		if (savedText) {
			handleTextChange(savedText)
		}
	}, [handleTextChange])
}

const useBionicReading = () => {
	const [bionicReading, setBionicReading] = useState(false)

	useEffect(() => {
		const savedBionicReading = localStorage.getItem('bionicReading')
		if (savedBionicReading) {
			setBionicReading(savedBionicReading === 'true')
		}
	}, [])

	const toggleBionicReading = useCallback(() => {
		setBionicReading(prev => {
			const newValue = !prev
			localStorage.setItem('bionicReading', newValue.toString())
			return newValue
		})
	}, [])

	return [bionicReading, toggleBionicReading] as const
}

const useSavedItems = (loadText: (text: string) => void) => {
	const [savedItems, setSavedItems] = useState<
		Array<{date: string; text: string}>
	>([])

	useEffect(() => {
		const savedItems = JSON.parse(localStorage.getItem('savedItems') || '[]')
		const parsed = z
			.array(
				z.object({
					text: z.string().min(1),
					date: z.string().min(1)
				})
			)
			.parse(savedItems)
		setSavedItems(parsed)
	}, [])

	const saveCurrentText = useCallback(
		(text: string) => {
			const date = new Date().toLocaleString()
			const newItem = {date, text}
			const updatedItems = [...savedItems, newItem]
			localStorage.setItem('savedItems', JSON.stringify(updatedItems))
			setSavedItems(updatedItems)
		},
		[savedItems]
	)

	const loadItem = useCallback(
		(text: string) => {
			loadText(text)
		},
		[loadText]
	)

	return {savedItems, saveCurrentText, loadItem}
}

const TextareaHighlight: FC = () => {
	const [bionicReading, toggleBionicReading] = useBionicReading()
	const {text, highlightedText, handleTextChange} = useTextChange(bionicReading)
	const textareaRef = useTextareaRef(text)
	useSavedText(handleTextChange)
	const {savedItems, saveCurrentText, loadItem} =
		useSavedItems(handleTextChange)

	const handleCheckboxChange = useCallback(() => {
		toggleBionicReading()
		handleTextChange(text)
	}, [toggleBionicReading, handleTextChange, text])

	return (
		<div className='flex mx-auto gap-4 flex-wrap'>
			<div className='flex flex-col gap-4 max-w-[70ch]'>
				<Textarea
					placeholder='Provide the text here'
					value={text}
					onChange={({target}) => handleTextChange(target.value)}
					ref={textareaRef}
				/>
				<div
					className='bg-black text-white p-4 rounded-md whitespace-pre-wrap'
					// biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
					dangerouslySetInnerHTML={{__html: highlightedText}}
				/>
			</div>
			<div className='gap-4'>
				<Label className='flex items-center gap-2'>
					<Checkbox
						checked={bionicReading}
						onCheckedChange={handleCheckboxChange}
					/>
					<span>Bionic Reading</span>
				</Label>
				<Button
					type='button'
					onClick={() => saveCurrentText(text)}
					className='mt-4'
				>
					Save Text
				</Button>
				<ul className='mt-2'>
					{savedItems.map(({text, date}) => (
						<li key={date} className='flex items-center gap-2 my-2'>
							<Button
								type='button'
								onClick={() => loadItem(text)}
								className='underline'
							>
								{date}
							</Button>
						</li>
					))}
				</ul>
			</div>
		</div>
	)
}

export default TextareaHighlight

// toast with undo of deleting
// deleting

// Colors are remembered after deleting nouns
// Form

// Make coloring no random. First take pure red than pure blue than pure green, then binary searching by half between red and blue , then again by half effect

// ChatGPT API request to clraify the text

// Test with Playwrite
