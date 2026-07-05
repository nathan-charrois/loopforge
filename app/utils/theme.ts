import { createTheme, type MantineColorsTuple } from '@mantine/core'

const primary: MantineColorsTuple = [
  '#f5f1ec',
  '#e9ded4',
  '#d7c4b4',
  '#bda18b',
  '#97765f',
  '#765741',
  '#604632',
  '#4d3727',
  '#3a291d',
  '#241811',
]

const theme = createTheme({
  colors: {
    primary,
  },
})

export default theme
