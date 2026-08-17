exports.up = (pgm) => {
  pgm.addColumn("users", {
    is_admin: {
      type: "boolean",
      notNull: true,
      default: false,
    },
  });
};

exports.down = false;
