'use client'

import React, {useEffect, useState, useRef} from 'react'
import {Textarea} from './ui/textarea'
import nlp from 'compromise'

const getRandomColor = (usedColors: Set<string>) => {
	let color
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
	const nounSet = new Set([
		...doc.match('#Noun').out('array'),
		...doc.nouns().out('array')
	])
	const nouns = Array.from(nounSet)

	// Count occurrences of each noun
	const nounCounts: {[key: string]: number} = {}
	nouns.forEach(noun => {
		const escapedNoun = escapeRegExp(noun)
		const count = (text.match(new RegExp(`\\b${escapedNoun}\\b`, 'gi')) || [])
			.length
		if (count > 1) {
			nounCounts[noun] = count
		}
	})

	// Assign colors only to repeated nouns if not already assigned
	const repeatedNouns = Object.keys(nounCounts)
	repeatedNouns.forEach(noun => {
		if (!colorDict[noun]) {
			const color = getRandomColor(usedColors)
			colorDict[noun] = color
			usedColors.add(color)
		}
	})

	let highlightedText = text
	for (let noun in colorDict) {
		if (colorDict.hasOwnProperty(noun)) {
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

const TextareaHighlight: React.FC = () => {
	const [text, setText] = useState('')
	const [highlightedText, setHighlightedText] = useState('')
	const colorDict = useRef<{[key: string]: string}>({})
	const usedColors = useRef<Set<string>>(new Set())

	useEffect(() => {
		setHighlightedText(
			highlightRepeatedNouns(text, colorDict.current, usedColors.current)
		)
	}, [text])

	return (
		<div className='flex flex-col gap-4'>
			<Textarea
				placeholder='Provide the text here'
				value={text}
				onChange={({target}) => setText(target.value)}
			/>
			<div
				className='bg-black text-white p-4 rounded-md whitespace-pre-wrap'
				dangerouslySetInnerHTML={{__html: highlightedText}}
			/>
		</div>
	)
}

export default TextareaHighlight
