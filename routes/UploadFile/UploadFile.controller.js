const multer = require("multer");
const xlsx = require("xlsx");
const {
  saveFootballMessage,
  fetchContentItems,
  deleteContentItems,
  saveGoalAlertContent,
  fethcGoalContent,
  _npfl_fetchContentItems,
} = require("./UploadFile.services");

module.exports = {
  uploadContent: (req, res) => {
    try {
      const fileBuffer = req.file.buffer;

      // Parse the Excel file using xlsx
      const workbook = xlsx.read(fileBuffer, { type: "buffer" });

      // Assuming you have a single sheet in the Excel file, you can access it like this:
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      // Parse the data from the sheet (example: converting it to JSON)
      const jsonData = xlsx.utils.sheet_to_json(sheet, {
        dateNF: "yyyy-mm-dd HH:mm:ss",
        raw: false, // Ensure that cell values are not treated as strings
      });

      // Now you have the data from the Excel file in the `jsonData` variable
      // Parse date strings to Date objects
      const parsedData = jsonData.map((row) => ({
        ...row,
        // Assuming the date column is named 'date'
        // date: parse(row.date, "yyyy-MM-dd HH:mm:ss", new Date()),
      }));

      // You can now use `parsedData`, where the 'date' property is a Date object
      console.log(parsedData);
      for (const item of parsedData) {
        if (
          !item.DATE ||
          !item.TIME ||
          !item.TYPE ||
          !item.QUESTION ||
          !item.Correct_Answer
        ) {
          return res.status(400).json({
            error: "One or more required keys are missing in the data.",
          });
        }
      }

      parsedData.map((data) =>
        saveFootballMessage(
          data.DATE,
          data.TIME,
          data.TYPE,
          data.QUESTION,
          data.Correct_Answer
        )
      );
      res.json(parsedData);
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "An error occurred while processing the file." });
    }
  },
  uploadGoalAlertContent: async (req, res) => {
    const fileBuffer = req.file.buffer;

    // Parse the Excel file using xlsx
    const workbook = xlsx.read(fileBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Parse the data from the sheet (example: converting it to JSON)
    const jsonData = xlsx.utils.sheet_to_json(sheet, {
      dateNF: "yyyy-mm-dd HH:mm:ss",
      raw: false, // Ensure that cell values are not treated as strings
    });

    // Now you have the data from the Excel file in the `jsonData` variable
    // Parse date strings to Date objects
    const parsedData = jsonData.map((row) => ({
      ...row,
      // Assuming the date column is named 'date'
      // date: parse(row.date, "yyyy-MM-dd HH:mm:ss", new Date()),
    }));

    // You can now use `parsedData`, where the 'date' property is a Date object
    // console.log(parsedData);
    const saving = parsedData.map(async (message) => {
      const [err, done] = await saveGoalAlertContent(message["Content "]);
      console.log(err);
      if (err) {
        // throw err;
        return res.status(500).json({
          error: "Internal server error",
        });
      }
      return true;
    });
    const result = await Promise.resolve(saving);
    return res.json(parsedData);
  },
  fetchContent: (req, res) => {
    fetchContentItems((err, footballContent) => {
      if (err) {
        return res.json({ result: 0, msg: "Internal server error" });
      }
      fethcGoalContent((err, goalContent) => {
        if (err) {
          return res.json({ result: 0, msg: "Internal server error" });
        }
        _npfl_fetchContentItems((err, npflContent) => {
          if (err) {
            return res.json({ result: 0, msg: "Internal server error" });
          }
          return res.json({
            footballContent,
            goalContent,
          });
        });
      });
    });
  },
  deleteContent: (req, res) => {
    const { id } = req.query;
    deleteContentItems(id, (err, result) => {
      if (err) throw err;

      res.json({ message: result });
    });
  },
};
