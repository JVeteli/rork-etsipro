import { createServer } from "node:http";
import { readFileSync } from "node:fs";

const grab = readFileSync("/tmp/etsi/react-grab.js");
createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/javascript; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(grab);
}).listen(5202, () => console.log("serving react-grab on :5202"));
