"use client";

import { useEffect, useRef, useState } from "react";
import { DollarSign, UserRound } from "lucide-react";
import { calculateTip, parseDecimal } from "./calculate";
import styles from "./tip.module.css";

const presets = [5, 10, 15, 25, 50];

export function TipCalculator() {
  const [bill, setBill] = useState("0");
  const [people, setPeople] = useState("1");
  const [percentage, setPercentage] = useState(0);
  const [customOpen, setCustomOpen] = useState(false);
  const [custom, setCustom] = useState("");
  const [customError, setCustomError] = useState("");
  const customInput = useRef<HTMLInputElement>(null);
  const customButton = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef(false);
  const parsedBill = bill.trim() === "" ? 0 : parseDecimal(bill);
  const parsedPeople = parseDecimal(people);
  const peopleError =
    parsedPeople === null || !Number.isSafeInteger(parsedPeople) || parsedPeople < 1;
  const billError = parsedBill === null;
  const amounts =
    parsedBill !== null && parsedPeople !== null
      ? calculateTip(parsedBill, percentage, parsedPeople)
      : null;
  useEffect(() => {
    if (customOpen) customInput.current?.focus();
    else if (returnFocus.current) {
      returnFocus.current = false;
      if (document.activeElement === document.body) customButton.current?.focus();
    }
  }, [customOpen]);

  function commitCustom(event: React.FormEvent) {
    event.preventDefault();
    const value = parseDecimal(custom);
    if (value === null) {
      setCustomError("Enter a percentage of zero or more.");
      return;
    }
    setPercentage(value);
    returnFocus.current = true;
    setCustomOpen(false);
    setCustom("");
    setCustomError("");
  }

  function reset() {
    setBill("0");
    setPeople("1");
    setPercentage(0);
    setCustom("");
    setCustomOpen(false);
    setCustomError("");
  }

  return (
    <div className={styles.page}>
      <h1 className="sr-only">Tip calculator</h1>
      <div className={styles.calculator}>
        <div className={styles.inputs}>
          <div className={styles.field}>
            <div className={styles.labelRow}>
              <label htmlFor="bill">Bill</label>
              {billError && <span id="bill-error">Enter a valid amount</span>}
            </div>
            <div className={styles.inputWrap}>
              <DollarSign size={20} aria-hidden />
              <input
                id="bill"
                value={bill}
                onChange={(e) => setBill(e.target.value)}
                inputMode="decimal"
                autoComplete="off"
                aria-invalid={billError}
                aria-describedby={billError ? "bill-error" : undefined}
              />
            </div>
          </div>
          <fieldset className={styles.tipField}>
            <legend>Select Tip %</legend>
            <div className={styles.presets}>
              {presets.map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={percentage === value && !customOpen}
                  className={percentage === value && !customOpen ? styles.selected : undefined}
                  onClick={() => {
                    setPercentage(value);
                    setCustomOpen(false);
                    setCustom("");
                    setCustomError("");
                  }}
                >
                  {value}%
                </button>
              ))}
              {!customOpen ? (
                <button
                  ref={customButton}
                  type="button"
                  className={styles.customButton}
                  onClick={() => setCustomOpen(true)}
                >
                  Custom
                </button>
              ) : (
                <form onSubmit={commitCustom}>
                  <input
                    ref={customInput}
                    aria-label="Custom tip percentage"
                    inputMode="decimal"
                    value={custom}
                    placeholder="Custom"
                    onChange={(e) => {
                      setCustom(e.target.value);
                      setCustomError("");
                    }}
                    aria-invalid={!!customError}
                    aria-describedby="custom-help"
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        returnFocus.current = true;
                        setCustomOpen(false);
                        setCustomError("");
                      }
                    }}
                  />
                </form>
              )}
            </div>
            {customOpen ? (
              <p id="custom-help" className={styles.help}>
                {customError || "Press Enter to apply your percentage."}
              </p>
            ) : (
              <p className={styles.help}>Selected tip: {percentage}%</p>
            )}
          </fieldset>
          <div className={styles.field}>
            <div className={styles.labelRow}>
              <label htmlFor="people">Number of people</label>
              {peopleError && <span id="people-error">Use a whole number, 1 or more</span>}
            </div>
            <div className={styles.inputWrap}>
              <UserRound size={19} aria-hidden />
              <input
                id="people"
                value={people}
                onChange={(e) => setPeople(e.target.value)}
                inputMode="numeric"
                autoComplete="off"
                aria-invalid={peopleError}
                aria-describedby={peopleError ? "people-error" : undefined}
              />
            </div>
          </div>
        </div>
        <div className={styles.results}>
          <div className={styles.amounts} aria-live="polite" aria-atomic="true">
            <div className={styles.resultRow}>
              <div>
                Tip Amount<span>/ person</span>
              </div>
              <output aria-label="Tip per person">
                {amounts ? "$" + amounts.tipPerPerson.toFixed(2) : "Unavailable"}
              </output>
            </div>
            <div className={styles.resultRow}>
              <div>
                Total<span>/ person</span>
              </div>
              <output aria-label="Total per person">
                {amounts ? "$" + amounts.totalPerPerson.toFixed(2) : "Unavailable"}
              </output>
            </div>
          </div>
          <button className={styles.reset} type="button" onClick={reset}>
            RESET
          </button>
        </div>
      </div>
    </div>
  );
}
