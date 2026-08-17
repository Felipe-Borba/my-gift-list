const COLUMNS = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
};

function Grid({ columns = 2, children }) {
  return (
    <div className={`grid grid-cols-1 gap-4 ${COLUMNS[columns]}`}>
      {children}
    </div>
  );
}

export default Grid;
