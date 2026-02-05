import { Typography, Card, CardContent, Box, List, ListItem, ListItemText } from '@mui/material'

const placeholderWords = ['word 1', 'word 2', 'word 3']

export function HomePage() {
  return (
    <>
      <Typography variant="h4" gutterBottom>
        Home
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
        <Card sx={{ minWidth: 160 }}>
          <CardContent>word 1</CardContent>
        </Card>
        <Card sx={{ minWidth: 160 }}>
          <CardContent>word 2</CardContent>
        </Card>
        <Card sx={{ minWidth: 160 }}>
          <CardContent>word 3</CardContent>
        </Card>
      </Box>
      <Typography variant="h6" gutterBottom>
        Words
      </Typography>
      <List dense>
        {placeholderWords.map((word, i) => (
          <ListItem key={i}>
            <ListItemText primary={word} />
          </ListItem>
        ))}
      </List>
    </>
  )
}
