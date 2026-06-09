import { currency, percent } from "@/lib/format";
import type { LoanRow } from "@/lib/loans/schema";

export interface ParsedAddLoan {
  bank_name?: string;
  borrowed_amount?: number;
  interest_rate?: number;
  tenure_months?: number;
  purpose?: string;
}

export interface ParsedModifyLoan {
  loanId?: string; // resolved database ID
  bank_name?: string;
  loan_number?: string;
  borrowed_amount?: number;
  interest_rate?: number;
  tenure_months?: number;
  extra_payment?: number;
  balloon_date?: string;
}

export interface BotResponse {
  message: string;
  intent: "add_loan" | "modify_loan" | "faq" | "conversational" | "unresolved";
  data?: any;
}

export interface FAQItem {
  keywords: string[];
  title: string;
  response: string;
}

export const FAQs: FAQItem[] = [
  {
    keywords: ["formula", "emi", "calculate emi", "math", "calculation", "compute"],
    title: "How is the Monthly EMI Calculated?",
    response: `The **Equated Monthly Installment (EMI)** is calculated using the standard reducing balance formula:

$$EMI = \\frac{P \\times r \\times (1 + r)^n}{(1 + r)^n - 1}$$

Where:
* **P** = Principal (Borrowed Amount)
* **r** = Monthly Interest Rate (Annual Rate / 12 / 100). E.g., for 6% annual interest, $r = 6 / 12 / 100 = 0.005$.
* **n** = Tenure in months.

Interest is calculated on the remaining outstanding principal at the beginning of each month. This means each month's payment goes more towards principal and less towards interest than the previous month.`,
  },
  {
    keywords: ["reducing vs flat", "reducing rate", "flat rate", "flat interest", "comparison"],
    title: "Reducing Balance vs. Flat Rate Interest",
    response: `There is a massive difference in how interest is computed:

1. **Reducing Balance (Amortix Standard):**
   Interest is calculated each month on the *remaining outstanding balance*. As you pay down principal, the interest portion of your EMI drops, and more goes toward clearing principal. This compound reduction saves you thousands of dollars.
   
2. **Flat Rate Interest:**
   Interest is calculated on the *original borrowed amount* for the entire duration. Even when you have paid off 90% of the loan, you are still charged interest on the original 100% principal!
   
A 10% flat rate is equivalent to roughly an 18% reducing rate over a 5-year tenure.`,
  },
  {
    keywords: ["extra payment", "prepayment", "extra monthly", "accelerate", "save interest", "early payoff"],
    title: "How do Extra Payments Save Money?",
    response: `Making extra monthly payments is the single most effective way to save interest and pay off a loan early.

* **Principal Reduction:** Any amount paid *above* the monthly EMI goes **100% towards reducing the principal balance** immediately.
* **Compounding Savings:** Because the principal balance drops faster, the interest calculated for all future months decreases. This creates a compounding savings loop: lower interest next month means more of your standard EMI goes towards principal, accelerating your path to payoff!

Adding just $200/month extra to a $250,000, 20-year loan at 6% interest saves over **$30,000 in interest** and pays off the loan **3.5 years early**!`,
  },
  {
    keywords: ["balloon", "lump sum", "balloon date", "balloon payment", "balloon payoff"],
    title: "What is a Balloon Payment?",
    response: `A **Balloon Payment** is a large, lump-sum payment made at a specific, designated date before the standard tenure ends, intended to pay off the remaining balance of the loan in full.

* **Lower EMIs initially:** Loans can be structured with standard amortization schedules but are cut short by a balloon payoff.
* **Refinancing risk:** Borrowers must ensure they have cash reserves or can refinance the remaining balance when the balloon date arrives.
* **System calculation:** In Amortix, when you specify a balloon date, the system automatically computes the outstanding balance at that date to show you exactly how much your lump-sum payment will be.`,
  },
];

function cleanAmount(str: string): number | undefined {
  const clean = str.replace(/[$,]/g, "").trim().toLowerCase();
  const match = clean.match(/^([\d.]+)\s*(k|m|million|thousand)?$/);
  if (!match) return undefined;
  let val = parseFloat(match[1]);
  const suffix = match[2];
  if (suffix === "k" || suffix === "thousand") {
    val *= 1000;
  } else if (suffix === "m" || suffix === "million") {
    val *= 1000000;
  }
  return val;
}

function cleanRate(str: string): number | undefined {
  const match = str.match(/([\d.]+)\s*%/);
  if (match) return parseFloat(match[1]);
  const words = str.match(/([\d.]+)\s*(?:percent|interest)/i);
  if (words) return parseFloat(words[1]);
  const num = parseFloat(str);
  if (!isNaN(num) && num > 0 && num < 100) return num;
  return undefined;
}

function cleanTenure(str: string): number | undefined {
  const match = str.match(/([\d.]+)\s*(month|mo|year|yr|y)/i);
  if (!match) {
    const num = parseInt(str);
    if (!isNaN(num)) return num;
    return undefined;
  }
  const val = parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  if (unit.startsWith("y")) {
    return Math.round(val * 12);
  }
  return Math.round(val);
}

export function parseAddLoan(input: string): ParsedAddLoan | null {
  const lower = input.toLowerCase();
  const hasAddKeyword = /\b(add|create|new|register|insert)\b/i.test(lower);
  const hasLoanKeyword = /\b(loan|record|registry)\b/i.test(lower);
  
  if (!hasAddKeyword || !hasLoanKeyword) return null;

  const result: ParsedAddLoan = {};

  // Extract bank: Look for bank names after "from", "with", "at", "lender"
  const bankMatch = input.match(/(?:from|with|at|lender)\s+([A-Za-z\s]+?)(?:\s+(?:bank|loan|amount|interest|for|over|at|HL-)\b|$)/i);
  if (bankMatch) {
    result.bank_name = bankMatch[1].trim().replace(/\b(bank|loan)\b/gi, "").trim();
  } else {
    // Fallback: search for capitalized words that could represent a bank (excluding command verbs)
    const capMatch = input.match(/(?:Add|New|Create)\s+(?:a\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
    if (capMatch) {
      result.bank_name = capMatch[1].trim();
    }
  }

  // Extract amount
  const amountMatch = input.match(/(?:amount of|loan of|borrow|value of|\$)\s*([\d.,]+\s*(?:k|m|million|thousand)?)\b/i);
  if (amountMatch) {
    result.borrowed_amount = cleanAmount(amountMatch[1]);
  } else {
    const rawAmtMatch = input.match(/\b(\d+(?:[\d.,]*\d)?\s*(?:k|m|million|thousand))\b/i);
    if (rawAmtMatch) {
      result.borrowed_amount = cleanAmount(rawAmtMatch[1]);
    }
  }

  // Extract interest rate
  const rateMatch = input.match(/(?:interest|rate|at)\s*([\d.]+\s*%)\b/i) || input.match(/\b([\d.]+\s*(?:%|percent))\b/i);
  if (rateMatch) {
    result.interest_rate = cleanRate(rateMatch[1]);
  } else {
    const rawRateMatch = input.match(/(?:at|interest of|rate of)\s*([\d.]+)\b/i);
    if (rawRateMatch) {
      result.interest_rate = parseFloat(rawRateMatch[1]);
    }
  }

  // Extract tenure
  const tenureMatch = input.match(/(?:for|tenure of|over|period of)\s*([\d.]+\s*(?:months?|mos?|years?|yrs?|y))\b/i) || 
                      input.match(/\b([\d.]+\s*(?:months?|mos?|years?|yrs?))\b/i);
  if (tenureMatch) {
    result.tenure_months = cleanTenure(tenureMatch[1]);
  }

  if (result.bank_name || result.borrowed_amount || result.interest_rate || result.tenure_months) {
    return result;
  }
  return null;
}

export function parseModifyLoan(input: string, existingLoans: LoanRow[]): ParsedModifyLoan | null {
  const lower = input.toLowerCase();
  const isModify = /\b(modify|update|change|edit|set|adjust)\b/i.test(lower);
  if (!isModify) return null;

  const result: ParsedModifyLoan = {};

  // Try to find the loan ID/Match
  // 1. Check for explicit HL- number
  const hlMatch = input.match(/\b(HL-[A-Za-z0-9-]+)\b/i);
  let matchedLoan: LoanRow | undefined;

  if (hlMatch) {
    const searchNo = hlMatch[1].trim().toLowerCase();
    matchedLoan = existingLoans.find(
      (l) => l.loan_number.toLowerCase().includes(searchNo) || searchNo.includes(l.loan_number.toLowerCase())
    );
  }

  // 2. If no HL- match, check for Bank Name keywords
  if (!matchedLoan) {
    for (const loan of existingLoans) {
      if (lower.includes(loan.bank_name.toLowerCase())) {
        matchedLoan = loan;
        break;
      }
    }
  }

  if (matchedLoan) {
    result.loanId = matchedLoan.id;
    result.bank_name = matchedLoan.bank_name;
    result.loan_number = matchedLoan.loan_number;
  }

  // Extract changes
  // Interest rate
  const rateMatch = input.match(/(?:interest|rate)(?:\s+to|\s+of)?\s*([\d.]+\s*%?)\b/i);
  if (rateMatch) {
    result.interest_rate = cleanRate(rateMatch[1]);
  }

  // Borrowed amount
  const amountMatch = input.match(/(?:amount|principal|borrowed)(?:\s+to|\s+of)?\s*([$]?[\d.,]+\s*(?:k|m|million|thousand)?)\b/i);
  if (amountMatch) {
    result.borrowed_amount = cleanAmount(amountMatch[1]);
  }

  // Tenure
  const tenureMatch = input.match(/(?:tenure|period|months|years)(?:\s+to|\s+of)?\s*([\d.]+\s*(?:months?|mos?|years?|yrs?|y))\b/i);
  if (tenureMatch) {
    result.tenure_months = cleanTenure(tenureMatch[1]);
  } else {
    // check raw number next to keyword
    const rawTenureMatch = input.match(/(?:tenure|period)(?:\s+to|\s+of)?\s*(\d+)\b/i);
    if (rawTenureMatch) {
      result.tenure_months = parseInt(rawTenureMatch[1]);
    }
  }

  // Extra payment
  const extraMatch = input.match(/(?:extra|payment|monthly extra)(?:\s+to|\s+of)?\s*([$]?[\d.,]+\s*(?:k|m|million|thousand)?)\b/i);
  if (extraMatch) {
    result.extra_payment = cleanAmount(extraMatch[1]);
  }

  // If we found a loan, or have variables
  if (result.loanId || result.interest_rate !== undefined || result.borrowed_amount !== undefined || result.tenure_months !== undefined || result.extra_payment !== undefined) {
    return result;
  }
  return null;
}

export function processMessage(message: string, existingLoans: LoanRow[]): BotResponse {
  const trimmed = message.trim();
  const lower = trimmed.toLowerCase();

  // 1. Check FAQ intents
  for (const faq of FAQs) {
    for (const kw of faq.keywords) {
      if (lower.includes(kw)) {
        return {
          message: `### ${faq.title}\n\n${faq.response}`,
          intent: "faq",
        };
      }
    }
  }

  // 2. Check Add Loan Intent
  const addDraft = parseAddLoan(trimmed);
  if (addDraft) {
    const missingFields: string[] = [];
    if (!addDraft.bank_name) missingFields.push("Bank Name");
    if (!addDraft.borrowed_amount) missingFields.push("Borrowed Amount");
    if (!addDraft.interest_rate) missingFields.push("Interest Rate");
    if (!addDraft.tenure_months) missingFields.push("Tenure");

    let reply = `I've parsed your request to **add a new loan**! Here is the draft:`;
    if (missingFields.length > 0) {
      reply += `\n\n*Note: I'm missing some parameters: ${missingFields.join(", ")}. Please enter them or verify the draft card below.*`;
    }

    return {
      message: reply,
      intent: "add_loan",
      data: {
        bank_name: addDraft.bank_name || "Chase Bank",
        borrowed_amount: addDraft.borrowed_amount || 250000,
        interest_rate: addDraft.interest_rate || 6.5,
        tenure_months: addDraft.tenure_months || 240,
        start_date: format(new Date(), "yyyy-MM-dd"),
        purpose: addDraft.purpose || "Corporate Loan",
        emi_type: "standard",
        loan_status: "active",
      },
    };
  }

  // 3. Check Modify Loan Intent
  const modifyDraft = parseModifyLoan(trimmed, existingLoans);
  if (modifyDraft) {
    if (!modifyDraft.loanId) {
      return {
        message: `I detected you want to **modify a loan**, but I couldn't identify which loan you are referring to. Please specify the Bank name or Loan number (e.g., "Change Chase loan interest rate to 5%").`,
        intent: "unresolved",
      };
    }

    const changesText: string[] = [];
    if (modifyDraft.borrowed_amount !== undefined) changesText.push(`Principal: **${currency(modifyDraft.borrowed_amount)}**`);
    if (modifyDraft.interest_rate !== undefined) changesText.push(`Rate: **${percent(modifyDraft.interest_rate)}**`);
    if (modifyDraft.tenure_months !== undefined) changesText.push(`Tenure: **${modifyDraft.tenure_months} months**`);
    if (modifyDraft.extra_payment !== undefined) changesText.push(`Extra Payment: **${currency(modifyDraft.extra_payment)}**`);

    if (changesText.length === 0) {
      return {
        message: `I found the loan **${modifyDraft.bank_name}** (#${modifyDraft.loan_number}), but I didn't see what changes you want to apply. Try saying: "Set interest rate of ${modifyDraft.bank_name} to 5%".`,
        intent: "unresolved",
      };
    }

    return {
      message: `I found the loan **${modifyDraft.bank_name}** (#${modifyDraft.loan_number}) and parsed these proposed modifications:\n\n${changesText.map((c) => `- ${c}`).join("\n")}`,
      intent: "modify_loan",
      data: modifyDraft,
    };
  }

  // 4. Check standard greetings or requests for help
  if (/\b(hi|hello|hey|greetings|help|bot|welcome|info)\b/i.test(lower)) {
    return {
      message: `Hi there! I am the **Amortix Assistant**, your conversational loan analyst.

I can help you perform database registry updates or explain loan logic. Here's what you can ask me:

**Registry Commands:**
* **Add a loan:** *"Add a loan of $300k at 6.2% for 180 months from HDFC Bank"*
* **Modify a loan:** *"Update Chase loan interest rate to 5.5%"* or *"Change HL-2024-00138 extra payment to 400"*

**Financial Logic Q&A:**
* *"How is monthly EMI calculated?"*
* *"Explain reducing balance vs flat rate"*
* *"How do extra payments save money?"*
* *"What is a balloon payment?"*

What can I help you check today?`,
      intent: "conversational",
    };
  }

  // 5. Unresolved default response
  return {
    message: `I didn't quite capture that command. I can assist you with adding/modifying loans, or explaining financial logic.

Try saying:
* *"Add a loan of 200k from Chase at 5% for 15 years"*
* *"Explain prepayments"*
* Or type **"help"** to see all options.`,
    intent: "unresolved",
  };
}

// Simple date formatter helper
function format(date: Date, fmt: string): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
