const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 5000;


// MIDDLEWARE
app.use(cors());
app.use(express.json());

app.get( '/' , (req , res) => {
    res.send('Tech Trove is coming')
});

app.listen(port , () => {
    console.log(`Tech Trove is running on port: ${port}`)
})