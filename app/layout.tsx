import type {Metadata} from 'next'
import {Inter} from 'next/font/google'
import './globals.css'
import {cn} from '@/lib/utils'
import {ThemeProvider} from '@/components/theme-provider'

const inter = Inter({subsets: ['latin']})

export const metadata: Metadata = {
	title: 'Noun Painter',
	description:
		'Colors found nouns in the text to help with understanding the text context.'
}

export default function RootLayout({
	children
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang='en'>
			<body
				className={cn(
					'min-h-screen bg-background font-sans antialiased',
					inter.className
				)}
			>
				<ThemeProvider
					attribute='class'
					defaultTheme='system'
					enableSystem
					disableTransitionOnChange
				>
					{children}
				</ThemeProvider>{' '}
			</body>
		</html>
	)
}
