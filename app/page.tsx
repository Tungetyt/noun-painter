import {ModeToggle} from '@/components/mode-toggle'
import TextareaHighlight from '@/components/textarea-highlight'

export default function Home() {
	return (
		<main className='flex min-h-screen flex-col items-center justify-between p-24'>
			<TextareaHighlight />
			<ModeToggle />
		</main>
	)
}
