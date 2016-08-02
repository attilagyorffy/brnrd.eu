var connect = require('connect'),
    serveStatic = require('serve-static');

var app = connect();

app.use(serveStatic("./output"));
app.listen(5000);
console.log("Server running on port 5000.")
