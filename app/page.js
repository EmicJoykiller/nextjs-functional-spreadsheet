'use client';

import React, { useState, useEffect } from 'react'; // <-- Add this import
import './globals.css';

const infixToFunction = {
  "+": (x, y) => x + y,
  "-": (x, y) => x - y,
  "*": (x, y) => x * y,
  "/": (x, y) => x / y,
}

const infixEval = (str, regex) => str.replace(regex, (_match, arg1, operator, arg2) => infixToFunction[operator](parseFloat(arg1), parseFloat(arg2)));

const highPrecedence = str => {
  const regex = /([\d.]+)([*\/])([\d.]+)/;
  const str2 = infixEval(str, regex);
  return str === str2 ? str : highPrecedence(str2);
}

const isEven = num => num % 2 === 0;
const sum = nums => nums.reduce((acc, el) => acc + el, 0);
const average = nums => nums.length === 0 ? 0 : sum(nums) / nums.length;

const spreadsheetFunctions = {
  sum,
  average,
  median: nums => {
    const sorted = nums.slice().sort((a, b) => a - b);
    const length = sorted.length;
    const middle = length / 2 - 1;
    return length % 2 === 0
      ? average([sorted[middle], sorted[middle + 1]])
      : sorted[Math.ceil(middle)];
  },
  even: nums => nums.filter(isEven),
  random: ([x, y]) => Math.floor(Math.random() * (y - x + 1) + x),
  nodupes: nums => [...new Set(nums).values()],
  "": arg => arg 
}

const applyFunction = str => {
  const noHigh = highPrecedence(str);
  const infix = /([\d.]+)([+-])([\d.]+)/;
  const str2 = infixEval(noHigh, infix);
  const functionCall = /([a-z0-9]*)\(([0-9., ]*)\)(?!.*\()/i;
  const toNumberList = args => args.split(",").map(parseFloat);
  const apply = (fn, args) => spreadsheetFunctions[fn.toLowerCase()](toNumberList(args));
  return str2.replace(functionCall, (match, fn, args) => spreadsheetFunctions.hasOwnProperty(fn.toLowerCase()) ? apply(fn, args) : match);
}

const evalFormula = (x, cells) => {
  const idToText = id => cells.find(cell => cell.id === id).value;
  const rangeRegex = /([A-J])([1-9][0-9]?):([A-J])([1-9][0-9]?)/gi;
  const rangeFromString = (num1, num2) => Array(num2 - num1 + 1).fill(num1).map((_, index) => num1 + index);
  const cellRegex = /[A-J][1-9][0-9]?/gi;
  const rangeExpanded = x.replace(rangeRegex, (_match, char1, num1, char2, num2) => rangeFromString(num1, num2).map(num => `${char1}${num}`));
  const cellExpanded = rangeExpanded.replace(cellRegex, match => idToText(match.toUpperCase()));
  const functionExpanded = applyFunction(cellExpanded);
  return functionExpanded === x ? functionExpanded : evalFormula(functionExpanded, cells);
}

export default function Home() {
  const [cells, setCells] = useState([]);
  
  useEffect(() => {
    const createCells = () => {
      const newCells = [];
      for (let row = 1; row <= 99; row++) {
        for (let col = 65; col <= 74; col++) {
          newCells.push({
            id: String.fromCharCode(col) + row,
            value: ''
          });
        }
      }
      setCells(newCells);
    };
    createCells();
  }, []);

  const updateCell = (e, id) => {
    const value = e.target.value;
    setCells(prevCells => prevCells.map(cell => 
      cell.id === id ? { ...cell, value: value } : cell
    ));
  };

  const handleFormulaChange = (e, id) => {
    const formula = e.target.value;
    if (formula.startsWith('=')) {
      const result = evalFormula(formula.slice(1), cells);
      setCells(prevCells => prevCells.map(cell => 
        cell.id === id ? { ...cell, value: result } : cell
      ));
    }
  };

  return (
    <div className="container">
      <div className="grid">
        {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].map(letter => (
          <div className="header" key={letter}>{letter}</div>
        ))}
        {Array.from({ length: 99 }, (_, row) => (
          <React.Fragment key={row}>
            <div className="rowHeader">{row + 1}</div>
            {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].map(letter => {
              const cellId = letter + (row + 1);
              const cell = cells.find(c => c.id === cellId);
              return (
                <input 
                  key={cellId} 
                  id={cellId}
                  className="cell"
                  value={cell ? cell.value : ''}
                  onChange={e => handleFormulaChange(e, cellId)}
                  onInput={e => updateCell(e, cellId)}
                />
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
