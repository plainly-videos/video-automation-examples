import { expect, test } from "vitest";
import { checkRecipient, readClients } from "@/lib/recipients";

const emma = {
  name: "Emma Johnson",
  title: "Head of Marketing",
  company: "Northwind",
  headshot: "https://randomuser.me/api/portraits/women/44.jpg",
};
const header = "name,title,company,headshot";
const line = `Emma Johnson,Head of Marketing,Northwind,${emma.headshot}`;

test("checkRecipient accepts a complete client", () => {
  expect(checkRecipient(emma)).toBeUndefined();
});

test("checkRecipient names the first problem", () => {
  expect(checkRecipient({ ...emma, name: "  " })).toBe("Missing name");
  expect(checkRecipient({ ...emma, title: "" })).toBe("Missing title");
  expect(checkRecipient({ ...emma, company: "" })).toBe("Missing company");
  expect(checkRecipient({ ...emma, headshot: "" })).toBe("Missing headshot");
  for (const headshot of [
    "photo.jpg",
    "javascript:alert(1)",
    "ftp://x/y.jpg",
  ]) {
    expect(checkRecipient({ ...emma, headshot }), headshot).toBe(
      "Headshot must be an http(s) URL",
    );
  }
});

test("checkRecipient keeps title and company to one line in the video", () => {
  // 22 characters fit on one line of the badge, longer ones wrap into each other
  expect(
    checkRecipient({ ...emma, title: "Senior Vice President," }),
  ).toBeUndefined();
  expect(checkRecipient({ ...emma, title: "Head of Global Partners" })).toBe(
    "Title is too long (max 22 characters)",
  );
  expect(
    checkRecipient({ ...emma, company: "International Business" }),
  ).toBeUndefined();
  expect(
    checkRecipient({ ...emma, company: "International Business Machines" }),
  ).toBe("Company is too long (max 22 characters)");
});

test("readClients maps headers in any order, case and spacing, and ignores extra columns", () => {
  const csv = ` Headshot ,NAME,Company,title,email\n${emma.headshot},Emma Johnson,Northwind,Head of Marketing,e@x.com`;
  expect(readClients(csv)).toEqual({ rows: [emma] });
});

test("readClients handles a BOM, CRLF, quoted commas, blank and comma-only lines", () => {
  const csv = `\uFEFF${header}\r\n Emma Johnson ,Head of Marketing,"Northwind, Inc.",${emma.headshot}\r\n,,,\r\n\r\n`;
  expect(readClients(csv)).toEqual({
    rows: [{ ...emma, company: "Northwind, Inc." }],
  });
});

test("readClients keeps invalid rows with their error", () => {
  expect(readClients(`${header}\nLiam O'Brien,CTO,Acme,`).rows).toEqual([
    {
      name: "Liam O'Brien",
      title: "CTO",
      company: "Acme",
      headshot: "",
      error: "Missing headshot",
    },
  ]);
});

test("readClients fails the file when columns are missing", () => {
  expect(readClients("name,company\nEmma,Northwind")).toEqual({
    rows: [],
    error:
      "Missing columns: title, headshot. Expected headers: name, title, company, headshot.",
  });
});

test("readClients fails an empty file", () => {
  expect(readClients("")).toEqual({
    rows: [],
    error: "The CSV file is empty.",
  });
  expect(readClients("\uFEFF\n")).toEqual({
    rows: [],
    error: "The CSV file is empty.",
  });
});

test("readClients fails when there are more valid clients than one batch takes", () => {
  const csv = [header, ...Array(101).fill(line)].join("\n");
  expect(readClients(csv).error).toBe(
    "Too many clients: 101 valid rows, at most 100 per batch.",
  );
});
