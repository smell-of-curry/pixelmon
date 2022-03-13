import scraper from "table-scraper";
import fs from "fs";

//capitalize only the first letter of the string.
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

scraper.get("https://pixelmonmod.com/wiki/Pidgey").then(function (tableData) {
  fs.writeFile(
    "generate/test.json",
    JSON.stringify(
      tableData[1][15][4].match(/[0-9]+/g).map((elm) => parseInt(elm))
    ),
    function (err) {
      if (err) throw err;
      console.log("complete");
    }
  );
});
