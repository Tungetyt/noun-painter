'use client'

import type React from 'react'
import {
	useEffect,
	useState,
	useRef,
	useCallback,
	type Dispatch,
	type SetStateAction
} from 'react'
import {Textarea} from './ui/textarea'
import nlp from 'compromise'
import DOMPurify from 'dompurify'

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

const highlightRepeatedNouns = (
	text: string,
	colorDict: {[key: string]: string},
	usedColors: Set<string>
) => {
	const doc = nlp(text)
	const nounSet = new Set<string>(doc.nouns().out('array'))
	const nouns = Array.from(nounSet)

	// Count occurrences of each noun
	const nounCounts: {[key: string]: number} = {}
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
	for (const noun of repeatedNouns) {
		if (!colorDict[noun]) {
			const color = getRandomColor(usedColors)
			colorDict[noun] = color
			usedColors.add(color)
		}
	}

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

	return highlightedText
}

const useTextChange = () => {
	const [text, setText] = useState('')
	const [highlightedText, setHighlightedText] = useState('')

	const colorDict = useRef<{[key: string]: string}>({})
	const usedColors = useRef<Set<string>>(new Set())

	const handleTextChange = useCallback((newText: string) => {
		setText(newText)
		const rawHtml = highlightRepeatedNouns(
			newText,
			colorDict.current,
			usedColors.current
		)
		const sanitizedHtml = DOMPurify.sanitize(rawHtml)
		setHighlightedText(sanitizedHtml)
		localStorage.setItem('highlightedText', newText) // Save text to localStorage
	}, [])

	return {text, highlightedText, handleTextChange}
}

const TextareaHighlight: React.FC = () => {
	const textareaRef = useRef<HTMLTextAreaElement | null>(null)

	const {text, highlightedText, handleTextChange} = useTextChange()

	useEffect(() => {
		const savedText = localStorage.getItem('highlightedText')
		if (savedText) {
			handleTextChange(savedText)
		}
	}, [handleTextChange])

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		if (textareaRef.current) {
			textareaRef.current.style.height = 'auto'
			textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
		}
	}, [text])

	return (
		<div className='flex flex-col gap-4 w-[70ch] mx-auto'>
			<Textarea
				placeholder='Provide the text here'
				value={text}
				onChange={e => handleTextChange(e.target.value)}
				ref={textareaRef}
			/>
			<div
				className='bg-black text-white p-4 rounded-md whitespace-pre-wrap'
				// biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
				dangerouslySetInnerHTML={{__html: highlightedText}}
			/>
		</div>
	)
}

export default TextareaHighlight
