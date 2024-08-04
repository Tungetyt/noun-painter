import {ModeToggle} from '@/components/mode-toggle'
import TextareaHighlight from '@/components/textarea-highlight'

export default function Home() {
	return (
		<main className='flex min-h-screen justify-between p-4 flex-wrap'>
			<TextareaHighlight />
			<ModeToggle />
		</main>
	)
}
