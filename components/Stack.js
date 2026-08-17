const GAPS = {
  2: "gap-2",
  3: "gap-3",
  4: "gap-4",
  6: "gap-6",
  8: "gap-8",
};

function Stack({ gap = 4, children }) {
  return <div className={`flex flex-col ${GAPS[gap]}`}>{children}</div>;
}

export default Stack;
