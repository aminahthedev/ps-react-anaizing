import React from "react";
import ProgressBar from "ps-react/ProgressBar";

/** 50% Progress and height 10px*/
export default function Example50Percent() {
  return <ProgressBar percent={50} width={150} height={10}/>;
}
