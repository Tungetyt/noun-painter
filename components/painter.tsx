'use client'

import {useState} from 'react'
import {Textarea} from './ui/textarea'

const Painter = () => {
	const [text, setText] = useState('')

	return (
		<>
			<Textarea
				placeholder='Provide the text here'
				onChange={({target}) => setText(target.value)}
			/>
			{text}
		</>
	)
}

export default Painter
