import { Outlet } from 'react-router-dom'
import { Box, Container } from '@mui/material'
import { Navbar } from './Navbar'

export function Layout() {
  return (
    <>
      <Navbar />
      <Box component="main" sx={{ py: 3 }}>
        <Container maxWidth="lg">
          <Outlet />
        </Container>
      </Box>
    </>
  )
}
