import {
  Typography,
  Card,
  CardContent,
  Box,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { PLACEHOLDER_WORDS } from "./HomePage.constants";

export function HomePage() {
  return (
    <>
      <Typography variant="h4" gutterBottom>
        Home
      </Typography>
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 3 }}>
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
        {PLACEHOLDER_WORDS.map((word, index) => (
          <ListItem key={index}>
            <ListItemText primary={word} />
          </ListItem>
        ))}
      </List>
    </>
  );
}
