const recommendIssues = async (req, res) => {
  try {
    const { skills } = req.body;

    console.log("Skills received:", skills);

    res.json({
      message: "API working",
      skills: skills
    });

  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
};

module.exports = { recommendIssues };