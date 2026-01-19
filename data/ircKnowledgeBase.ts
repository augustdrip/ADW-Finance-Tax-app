/**
 * Internal Revenue Code (IRC) Knowledge Base
 * Comprehensive tax law reference for business operations
 * 
 * Sources: 26 U.S. Code (Cornell Law, IRS.gov)
 * Last Updated: 2024
 */

export interface IRCSection {
  section: string;
  title: string;
  summary: string;
  keyPoints: string[];
  limits?: Record<string, string | number>;
  examples?: string[];
  relatedForms?: string[];
  scheduleC_line?: string;
  businessRelevance: 'high' | 'medium' | 'low';
  category: string;
}

export const IRC_KNOWLEDGE_BASE: IRCSection[] = [
  // ==========================================
  // PART 1: GROSS INCOME (§61-91)
  // ==========================================
  {
    section: "§61",
    title: "Gross Income Defined",
    summary: "Defines gross income as all income from whatever source derived, including compensation for services, business income, gains from property, interest, rents, royalties, dividends, and alimony.",
    keyPoints: [
      "Income is broadly defined - if in doubt, it's probably taxable",
      "Includes both cash and non-cash compensation",
      "Bartering creates taxable income at fair market value",
      "Forgiven debt is generally taxable income",
      "Illegal income is still taxable"
    ],
    relatedForms: ["Form 1040", "Schedule C", "Schedule 1"],
    businessRelevance: "high",
    category: "Income"
  },
  {
    section: "§62",
    title: "Adjusted Gross Income Defined",
    summary: "Defines AGI as gross income minus specific 'above-the-line' deductions including trade/business deductions, retirement contributions, and self-employment tax deduction.",
    keyPoints: [
      "Business expenses are 'above the line' deductions",
      "Self-employed health insurance deduction",
      "50% of self-employment tax is deductible",
      "SEP, SIMPLE, and qualified plan contributions",
      "Student loan interest (up to $2,500)"
    ],
    relatedForms: ["Form 1040", "Schedule 1"],
    businessRelevance: "high",
    category: "Income"
  },
  {
    section: "§63",
    title: "Taxable Income Defined",
    summary: "Taxable income equals AGI minus either the standard deduction or itemized deductions, and minus the qualified business income deduction.",
    keyPoints: [
      "Standard deduction 2024: $14,600 single, $29,200 MFJ",
      "QBI deduction taken after itemized/standard",
      "Itemize only if total exceeds standard deduction",
      "SALT deduction capped at $10,000"
    ],
    limits: {
      "standardDeduction_single_2024": 14600,
      "standardDeduction_mfj_2024": 29200,
      "SALT_cap": 10000
    },
    relatedForms: ["Form 1040", "Schedule A"],
    businessRelevance: "medium",
    category: "Income"
  },
  {
    section: "§74",
    title: "Prizes and Awards",
    summary: "Prizes and awards are generally included in gross income. Employee achievement awards have limited exclusions.",
    keyPoints: [
      "Business awards/prizes are taxable income",
      "Employee achievement awards excludable up to $1,600 (qualified plan)",
      "Length of service awards: excludable up to $400",
      "Must be tangible personal property, not cash"
    ],
    limits: {
      "qualifiedPlanAward": 1600,
      "nonQualifiedAward": 400
    },
    businessRelevance: "low",
    category: "Income"
  },

  // ==========================================
  // PART 2: BUSINESS EXPENSES (§162-199A)
  // ==========================================
  {
    section: "§162",
    title: "Trade or Business Expenses",
    summary: "THE primary section for business deductions. Allows deduction for all ordinary and necessary expenses paid or incurred in carrying on any trade or business.",
    keyPoints: [
      "Expense must be 'ordinary' (common in your industry)",
      "Expense must be 'necessary' (helpful and appropriate)",
      "Must be directly connected to business",
      "Capital expenditures must be depreciated, not expensed",
      "Reasonable compensation is deductible",
      "Business gifts limited to $25 per person per year"
    ],
    limits: {
      "businessGiftLimit": 25
    },
    examples: [
      "Salaries and wages",
      "Rent for business property",
      "Software subscriptions (SaaS)",
      "Professional services (legal, accounting)",
      "Advertising and marketing",
      "Office supplies",
      "Business insurance",
      "Contractor payments"
    ],
    relatedForms: ["Schedule C", "Form 1099-NEC"],
    scheduleC_line: "Multiple (8-27)",
    businessRelevance: "high",
    category: "Deductions"
  },
  {
    section: "§162(a)(1)",
    title: "Compensation for Services",
    summary: "Reasonable salaries, wages, and other compensation for personal services actually rendered are deductible.",
    keyPoints: [
      "Compensation must be 'reasonable' - IRS scrutinizes owner compensation",
      "Must be for services actually performed",
      "Includes bonuses, commissions, fringe benefits",
      "S-Corp shareholders must take reasonable salary before distributions",
      "Document time spent and market rates for your role"
    ],
    examples: [
      "Employee salaries",
      "Contractor payments (1099)",
      "Owner's reasonable salary (S-Corp)",
      "Performance bonuses"
    ],
    relatedForms: ["Form W-2", "Form 1099-NEC", "Schedule C Line 26"],
    businessRelevance: "high",
    category: "Deductions"
  },
  {
    section: "§162(a)(3)",
    title: "Rent Deduction",
    summary: "Rentals paid for use of property in a trade or business are deductible.",
    keyPoints: [
      "Office rent is fully deductible",
      "Equipment leases are deductible",
      "Prepaid rent may need to be amortized",
      "Related party rentals must be at fair market value",
      "Coworking space memberships qualify"
    ],
    scheduleC_line: "20b",
    relatedForms: ["Schedule C"],
    businessRelevance: "high",
    category: "Deductions"
  },
  {
    section: "§163",
    title: "Interest Expense",
    summary: "Interest paid on business debt is generally deductible. Includes loans, credit cards used for business, and equipment financing.",
    keyPoints: [
      "Business credit card interest is deductible",
      "Equipment loan interest deductible",
      "Line of credit interest deductible",
      "Personal credit card used for business - only business portion deductible",
      "Investment interest has limitations",
      "Business interest limitation for large businesses (§163(j))"
    ],
    scheduleC_line: "16",
    relatedForms: ["Schedule C", "Form 8990"],
    businessRelevance: "high",
    category: "Deductions"
  },
  {
    section: "§164",
    title: "Taxes",
    summary: "State and local taxes, real property taxes, and personal property taxes paid in carrying on a trade or business are deductible.",
    keyPoints: [
      "State income tax on business income (if itemizing)",
      "Business property taxes deductible on Schedule C",
      "Self-employment tax - 50% deductible as adjustment",
      "Employer portion of payroll taxes deductible",
      "SALT cap ($10K) applies to personal, not business taxes"
    ],
    limits: {
      "SALT_personal_cap": 10000
    },
    scheduleC_line: "23",
    relatedForms: ["Schedule C", "Schedule A", "Schedule SE"],
    businessRelevance: "high",
    category: "Deductions"
  },
  {
    section: "§165",
    title: "Losses",
    summary: "Business losses and casualty/theft losses are deductible. Net operating losses can be carried forward.",
    keyPoints: [
      "Business casualty losses fully deductible",
      "Theft losses deductible if documented",
      "Net Operating Loss (NOL) can offset 80% of future income",
      "NOL carryforward is indefinite (post-2017)",
      "Document all losses thoroughly"
    ],
    relatedForms: ["Form 4684", "Schedule C"],
    businessRelevance: "medium",
    category: "Deductions"
  },
  {
    section: "§166",
    title: "Bad Debts",
    summary: "Business bad debts (accounts receivable that become uncollectible) are deductible.",
    keyPoints: [
      "Must have been previously included in income",
      "Must be actually worthless (not just past due)",
      "Accrual method taxpayers: deduct when worthless",
      "Cash method: no deduction (never recorded as income)",
      "Document collection efforts"
    ],
    examples: [
      "Client invoices that will never be paid",
      "Loans to employees that defaulted"
    ],
    relatedForms: ["Schedule C"],
    businessRelevance: "medium",
    category: "Deductions"
  },
  {
    section: "§167",
    title: "Depreciation",
    summary: "Allows recovery of the cost of property used in business over its useful life through annual deductions.",
    keyPoints: [
      "Applies to property with useful life > 1 year",
      "Must own the property (not leased)",
      "Property must be used in business",
      "Land cannot be depreciated",
      "Various methods: straight-line, declining balance, MACRS"
    ],
    relatedForms: ["Form 4562", "Schedule C Line 13"],
    scheduleC_line: "13",
    businessRelevance: "high",
    category: "Depreciation"
  },
  {
    section: "§168",
    title: "MACRS Depreciation",
    summary: "Modified Accelerated Cost Recovery System - the primary depreciation method for most business property.",
    keyPoints: [
      "3-year property: certain manufacturing tools",
      "5-year property: computers, office equipment, vehicles, software",
      "7-year property: office furniture, fixtures",
      "15-year property: land improvements",
      "27.5-year: residential rental property",
      "39-year: nonresidential real property"
    ],
    limits: {
      "computers_years": 5,
      "furniture_years": 7,
      "vehicles_years": 5,
      "software_years": 3,
      "nonresidential_building_years": 39
    },
    examples: [
      "MacBook Pro: 5-year property",
      "Office desk: 7-year property",
      "Company vehicle: 5-year property",
      "Software (purchased): 3-year property"
    ],
    relatedForms: ["Form 4562"],
    businessRelevance: "high",
    category: "Depreciation"
  },
  {
    section: "§179",
    title: "Section 179 Expensing",
    summary: "Allows immediate expensing of the full cost of qualifying property in the year placed in service, instead of depreciating over time.",
    keyPoints: [
      "2024 limit: $1,220,000",
      "Phase-out begins at $3,050,000 of total property",
      "Must be tangible personal property",
      "Must be used >50% for business",
      "Cannot create or increase a loss",
      "Vehicles have separate limits (§280F)"
    ],
    limits: {
      "maxDeduction_2024": 1220000,
      "phaseoutThreshold_2024": 3050000,
      "SUV_limit": 28900
    },
    examples: [
      "New computer equipment - expense immediately",
      "Office furniture - expense up to limit",
      "Machinery - expense instead of 7-year depreciation"
    ],
    relatedForms: ["Form 4562 Part I"],
    scheduleC_line: "13",
    businessRelevance: "high",
    category: "Depreciation"
  },
  {
    section: "§168(k)",
    title: "Bonus Depreciation",
    summary: "Allows additional first-year depreciation for qualifying property. Being phased out 2023-2026.",
    keyPoints: [
      "2024: 60% bonus depreciation",
      "2025: 40% bonus depreciation",
      "2026: 20% bonus depreciation",
      "2027+: 0% (expired)",
      "Applies to new AND used property (if new to taxpayer)",
      "No income limitation (unlike §179)",
      "Can create a loss"
    ],
    limits: {
      "bonus_2024": "60%",
      "bonus_2025": "40%",
      "bonus_2026": "20%"
    },
    relatedForms: ["Form 4562"],
    businessRelevance: "high",
    category: "Depreciation"
  },
  {
    section: "§174",
    title: "Research and Experimental Expenditures",
    summary: "R&D costs must now be capitalized and amortized over 5 years (domestic) or 15 years (foreign) starting in 2022.",
    keyPoints: [
      "Software development costs are R&D",
      "Must amortize over 5 years (domestic)",
      "15 years for foreign research",
      "Applies to wages, supplies, contractor costs for R&D",
      "Major change from pre-2022 (was immediately deductible)",
      "Consider R&D tax credit (§41) to offset"
    ],
    examples: [
      "Custom software development",
      "App development costs",
      "AI/ML model development",
      "New technology research"
    ],
    relatedForms: ["Form 6765"],
    businessRelevance: "high",
    category: "Deductions"
  },
  {
    section: "§195",
    title: "Start-Up Expenditures",
    summary: "Costs incurred before business begins can be deducted: $5,000 immediately, remainder amortized over 180 months.",
    keyPoints: [
      "First $5,000 deductible in first year",
      "$5,000 reduced if startup costs exceed $50,000",
      "Remainder amortized over 180 months (15 years)",
      "Includes investigation costs, training, advertising before opening",
      "Must elect to deduct/amortize"
    ],
    limits: {
      "immediateDeduction": 5000,
      "phaseoutThreshold": 50000,
      "amortizationMonths": 180
    },
    relatedForms: ["Form 4562 Part VI"],
    businessRelevance: "medium",
    category: "Deductions"
  },
  {
    section: "§199A",
    title: "Qualified Business Income Deduction (QBI)",
    summary: "Pass-through businesses can deduct up to 20% of qualified business income. THE major tax benefit for sole proprietors, partnerships, and S-Corps.",
    keyPoints: [
      "Deduct 20% of QBI from taxable income",
      "Available to sole proprietors, partnerships, S-Corps",
      "Not available to C-Corps or employees",
      "Income limitations apply for 'specified service businesses' (SSTB)",
      "SSTB includes: law, accounting, consulting, financial services, performing arts",
      "W-2 wage and property limitations at higher incomes"
    ],
    limits: {
      "deductionRate": "20%",
      "SSTB_phaseout_single_2024": 191950,
      "SSTB_phaseout_mfj_2024": 383900,
      "SSTB_phaseout_range": 50000
    },
    examples: [
      "Agency earns $200K → potential $40K deduction",
      "Must calculate W-2 wages if above threshold",
      "SSTB limitation doesn't apply below threshold"
    ],
    relatedForms: ["Form 8995", "Form 8995-A"],
    businessRelevance: "high",
    category: "Deductions"
  },

  // ==========================================
  // PART 3: MEALS, ENTERTAINMENT, TRAVEL (§274)
  // ==========================================
  {
    section: "§274",
    title: "Disallowance of Entertainment and Certain Other Expenses",
    summary: "Limits or disallows deductions for meals, entertainment, travel, and gifts. Critical for any business with client/employee expenses.",
    keyPoints: [
      "Entertainment: 0% deductible (fully disallowed since 2018)",
      "Business meals: 50% deductible",
      "Employee meals on premises: 50% deductible",
      "Business gifts: $25 limit per person per year",
      "Must document: business purpose, attendees, amount, date, place"
    ],
    limits: {
      "mealDeduction": "50%",
      "entertainmentDeduction": "0%",
      "giftLimit": 25
    },
    scheduleC_line: "24b",
    relatedForms: ["Schedule C"],
    businessRelevance: "high",
    category: "Meals & Entertainment"
  },
  {
    section: "§274(d)",
    title: "Substantiation Requirements",
    summary: "Strict documentation requirements for travel, entertainment, gifts, and listed property (vehicles, computers).",
    keyPoints: [
      "Must document: amount, time/date, place, business purpose, business relationship",
      "Receipts required for expenses $75+",
      "Mileage log required for vehicle deduction",
      "Contemporaneous records (at or near time of expense)",
      "Per diem rates available as alternative"
    ],
    examples: [
      "Keep receipt showing restaurant, date, amount",
      "Note client name and business discussed",
      "Mileage log: date, destination, purpose, miles"
    ],
    relatedForms: ["Schedule C"],
    businessRelevance: "high",
    category: "Meals & Entertainment"
  },
  {
    section: "§274(n)",
    title: "Meal Expense Limitations",
    summary: "Business meals are limited to 50% deductible. Specific rules for different meal situations.",
    keyPoints: [
      "Client meals: 50% deductible if business discussed",
      "Employee meals (working): 50% deductible",
      "Office snacks/coffee: 50% deductible",
      "Team meals (morale): 50% deductible",
      "Meals included in entertainment: 0% (unless separately stated)"
    ],
    scheduleC_line: "24b",
    businessRelevance: "high",
    category: "Meals & Entertainment"
  },
  {
    section: "§162(a)(2)",
    title: "Travel Expenses",
    summary: "Travel expenses while away from home overnight for business are deductible, including transportation, lodging, and meals.",
    keyPoints: [
      "Must be 'away from home' overnight",
      "Airfare, hotels, rental cars fully deductible",
      "Meals while traveling: 50% deductible",
      "Incidental expenses (tips, baggage) deductible",
      "Per diem rates available",
      "Mixed business/personal trips: allocate expenses"
    ],
    limits: {
      "meals_deduction": "50%",
      "lodging": "100%",
      "transportation": "100%"
    },
    scheduleC_line: "24a",
    relatedForms: ["Schedule C", "Form 2106"],
    businessRelevance: "high",
    category: "Travel"
  },

  // ==========================================
  // PART 4: VEHICLE EXPENSES (§280F)
  // ==========================================
  {
    section: "§280F",
    title: "Luxury Vehicle Limitations",
    summary: "Limits depreciation deductions for passenger vehicles. Different rules for vehicles over 6,000 lbs GVWR.",
    keyPoints: [
      "Depreciation caps for cars under 6,000 lbs",
      "2024 Year 1 cap: $12,200 (or $20,200 with bonus)",
      "Years 2-3: lower caps apply",
      "Vehicles >6,000 lbs GVWR: higher limits",
      "SUVs >6,000 lbs: §179 capped at $28,900",
      "Must use >50% for business to claim depreciation"
    ],
    limits: {
      "year1_cap_2024": 12200,
      "year1_with_bonus_2024": 20200,
      "year2_cap": 19500,
      "year3_cap": 11700,
      "year4plus_cap": 6960,
      "heavySUV_179_limit": 28900
    },
    examples: [
      "Tesla Model 3: subject to luxury limits",
      "Ford F-150: may qualify for higher limits if >6,000 lbs",
      "Mercedes G-Wagon: heavy SUV, higher §179 limit"
    ],
    relatedForms: ["Form 4562"],
    businessRelevance: "high",
    category: "Vehicles"
  },
  {
    section: "§274(d) Vehicles",
    title: "Vehicle Expense Substantiation",
    summary: "Specific documentation requirements for vehicle expenses. Two methods: actual expenses or standard mileage rate.",
    keyPoints: [
      "Standard mileage rate 2024: 67 cents/mile",
      "Actual expense method: gas, insurance, repairs, depreciation",
      "Must track business vs personal miles",
      "Log required: date, destination, purpose, miles",
      "Commuting is NEVER deductible",
      "First trip of day from home office IS deductible"
    ],
    limits: {
      "standardMileageRate_2024": 0.67,
      "medicalMileageRate_2024": 0.21,
      "charityMileageRate": 0.14
    },
    examples: [
      "Drive to client meeting: deductible",
      "Drive from home to office: NOT deductible (commuting)",
      "Home office to client: deductible"
    ],
    scheduleC_line: "9",
    relatedForms: ["Schedule C", "Form 4562"],
    businessRelevance: "high",
    category: "Vehicles"
  },

  // ==========================================
  // PART 5: HOME OFFICE (§280A)
  // ==========================================
  {
    section: "§280A",
    title: "Home Office Deduction",
    summary: "Allows deduction for business use of home if used regularly and exclusively for business. Two methods available.",
    keyPoints: [
      "Must be 'regular and exclusive' business use",
      "Must be principal place of business OR meet clients there",
      "Simplified method: $5/sq ft, max 300 sq ft = $1,500",
      "Actual expense method: % of home expenses",
      "Includes: rent/mortgage interest, utilities, insurance, repairs",
      "Cannot create a loss (simplified method)"
    ],
    limits: {
      "simplifiedRate": 5,
      "maxSquareFootage": 300,
      "maxSimplifiedDeduction": 1500
    },
    examples: [
      "200 sq ft office × $5 = $1,000 deduction",
      "Actual: 10% of home = 10% of rent, utilities, etc."
    ],
    scheduleC_line: "30",
    relatedForms: ["Schedule C", "Form 8829"],
    businessRelevance: "high",
    category: "Home Office"
  },

  // ==========================================
  // PART 6: SELF-EMPLOYMENT TAX (§1401-1403)
  // ==========================================
  {
    section: "§1401",
    title: "Self-Employment Tax Rate",
    summary: "Self-employed individuals pay both employer and employee portions of Social Security and Medicare taxes.",
    keyPoints: [
      "Total SE tax rate: 15.3%",
      "Social Security: 12.4% (on first $168,600 in 2024)",
      "Medicare: 2.9% (no limit)",
      "Additional Medicare: 0.9% on earnings >$200K ($250K MFJ)",
      "SE tax calculated on 92.35% of net self-employment income",
      "50% of SE tax is deductible as adjustment to income"
    ],
    limits: {
      "socialSecurity_rate": "12.4%",
      "medicare_rate": "2.9%",
      "total_SE_rate": "15.3%",
      "socialSecurity_wage_base_2024": 168600,
      "additionalMedicare_threshold_single": 200000,
      "additionalMedicare_rate": "0.9%"
    },
    relatedForms: ["Schedule SE", "Form 1040"],
    businessRelevance: "high",
    category: "Self-Employment"
  },
  {
    section: "§1402",
    title: "Net Earnings from Self-Employment",
    summary: "Defines how to calculate net self-employment income for SE tax purposes.",
    keyPoints: [
      "Net SE income = Schedule C net profit",
      "Multiply by 92.35% for SE tax base",
      "Partners: their distributive share",
      "S-Corp shareholders: NOT subject to SE tax on distributions",
      "Guaranteed payments to partners: subject to SE tax"
    ],
    examples: [
      "Net profit $100,000 × 92.35% = $92,350 SE tax base",
      "$92,350 × 15.3% = $14,130 SE tax"
    ],
    relatedForms: ["Schedule SE"],
    businessRelevance: "high",
    category: "Self-Employment"
  },
  {
    section: "§162(l)",
    title: "Self-Employed Health Insurance Deduction",
    summary: "Self-employed can deduct 100% of health insurance premiums for themselves and family as an adjustment to income.",
    keyPoints: [
      "100% deductible as 'above the line' adjustment",
      "Includes medical, dental, vision, long-term care",
      "Cannot exceed net self-employment income",
      "Cannot deduct if eligible for employer plan",
      "Spouse/dependents covered too"
    ],
    relatedForms: ["Form 1040 Schedule 1"],
    businessRelevance: "high",
    category: "Self-Employment"
  },

  // ==========================================
  // PART 7: RETIREMENT PLANS (§401-409, §408)
  // ==========================================
  {
    section: "§401(k)",
    title: "Solo 401(k) Plans",
    summary: "Self-employed individuals can establish individual 401(k) plans with high contribution limits.",
    keyPoints: [
      "Employee deferral: $23,000 (2024), +$7,500 catch-up if 50+",
      "Employer contribution: 25% of compensation",
      "Total limit: $69,000 (2024), +$7,650 catch-up",
      "Can be traditional or Roth",
      "Loan provisions available",
      "Must be established by December 31"
    ],
    limits: {
      "employeeDeferral_2024": 23000,
      "catchUp_50plus": 7500,
      "totalLimit_2024": 69000,
      "employerContribution_percent": "25%"
    },
    relatedForms: ["Form 5500-EZ"],
    businessRelevance: "high",
    category: "Retirement"
  },
  {
    section: "§408",
    title: "SEP IRA",
    summary: "Simplified Employee Pension - easy retirement plan for self-employed with high contribution limits.",
    keyPoints: [
      "Contribution limit: 25% of net self-employment income",
      "Maximum: $69,000 (2024)",
      "Easy to set up - just need IRS Form 5305-SEP",
      "Can be established up to tax filing deadline (with extensions)",
      "Employer-only contributions (no employee deferrals)",
      "All eligible employees must be covered"
    ],
    limits: {
      "contribution_percent": "25%",
      "maxContribution_2024": 69000
    },
    relatedForms: ["Form 5305-SEP", "Form 1040"],
    businessRelevance: "high",
    category: "Retirement"
  },
  {
    section: "§408(p)",
    title: "SIMPLE IRA",
    summary: "Savings Incentive Match Plan for Employees - lower contribution limits but allows employee deferrals.",
    keyPoints: [
      "Employee deferral: $16,000 (2024)",
      "Catch-up (50+): additional $3,500",
      "Employer must match up to 3% or contribute 2% for all",
      "Easier admin than 401(k)",
      "Only for businesses with 100 or fewer employees"
    ],
    limits: {
      "employeeDeferral_2024": 16000,
      "catchUp_50plus": 3500,
      "employerMatch": "3%"
    },
    relatedForms: ["Form 5304-SIMPLE", "Form 5305-SIMPLE"],
    businessRelevance: "medium",
    category: "Retirement"
  },

  // ==========================================
  // PART 8: TAX CREDITS (§41, §45)
  // ==========================================
  {
    section: "§41",
    title: "Research & Development Tax Credit",
    summary: "Credit for increasing research activities. Can offset income tax or payroll tax for small businesses.",
    keyPoints: [
      "Credit = 20% of qualified research expenses over base",
      "Alternative Simplified Credit: 14% of expenses over 50% of 3-year average",
      "Small business (<$5M revenue): can offset payroll tax up to $500K/year",
      "Qualified expenses: wages, supplies, contractor costs for R&D",
      "Must be technological in nature, uncertainty, experimentation"
    ],
    limits: {
      "regularCredit_rate": "20%",
      "alternativeSimplifiedCredit_rate": "14%",
      "payrollTaxOffset_limit": 500000
    },
    examples: [
      "Custom software development",
      "Developing new products",
      "Improving existing processes",
      "Creating new algorithms/AI models"
    ],
    relatedForms: ["Form 6765"],
    businessRelevance: "high",
    category: "Credits"
  },
  {
    section: "§45B",
    title: "Small Employer Pension Plan Startup Credit",
    summary: "Credit for small businesses starting a new retirement plan.",
    keyPoints: [
      "Credit: 50% of startup costs, up to $500/year",
      "Additional credit: $500 for auto-enrollment feature",
      "Available for 3 years",
      "Must have 100 or fewer employees",
      "Employees must have received $5,000+ compensation"
    ],
    limits: {
      "maxCredit": 500,
      "autoEnrollCredit": 500,
      "years": 3
    },
    relatedForms: ["Form 8881"],
    businessRelevance: "medium",
    category: "Credits"
  },
  {
    section: "§48",
    title: "Energy Investment Tax Credit",
    summary: "Credit for installing solar, wind, and other clean energy systems.",
    keyPoints: [
      "Solar/wind: 30% credit through 2032",
      "Battery storage: 30% credit",
      "EV chargers: up to $100,000 credit for businesses",
      "Must meet wage and apprenticeship requirements for full credit",
      "Bonus for domestic content, energy communities"
    ],
    limits: {
      "solarCredit_2024": "30%",
      "EVCharger_limit": 100000
    },
    relatedForms: ["Form 3468"],
    businessRelevance: "medium",
    category: "Credits"
  },

  // ==========================================
  // PART 9: ESTIMATED TAXES (§6654)
  // ==========================================
  {
    section: "§6654",
    title: "Estimated Tax Payments",
    summary: "Self-employed must pay estimated taxes quarterly to avoid penalties.",
    keyPoints: [
      "Due dates: April 15, June 15, September 15, January 15",
      "Must pay 90% of current year OR 100% of prior year (110% if AGI >$150K)",
      "Penalty for underpayment",
      "Can use annualized income method if income varies",
      "State estimated taxes also required in most states"
    ],
    limits: {
      "safeHarbor_currentYear": "90%",
      "safeHarbor_priorYear": "100%",
      "safeHarbor_priorYear_highIncome": "110%"
    },
    examples: [
      "Q1 payment due April 15",
      "Q2 payment due June 15",
      "Q3 payment due September 15",
      "Q4 payment due January 15"
    ],
    relatedForms: ["Form 1040-ES"],
    businessRelevance: "high",
    category: "Estimated Taxes"
  },

  // ==========================================
  // PART 10: RECORD KEEPING (§6001)
  // ==========================================
  {
    section: "§6001",
    title: "Records and Special Returns",
    summary: "Taxpayers must keep adequate records to support all items on their tax return.",
    keyPoints: [
      "Keep records for at least 3 years (6 years recommended)",
      "Records must show income, deductions, credits, employment taxes",
      "Digital records acceptable if properly maintained",
      "Receipts required for expenses $75+",
      "Bank statements alone are insufficient - need business purpose",
      "7 years for bad debt or worthless securities"
    ],
    limits: {
      "minRetentionYears": 3,
      "recommendedRetentionYears": 6,
      "receiptThreshold": 75
    },
    examples: [
      "Invoices and receipts",
      "Bank and credit card statements",
      "Mileage logs",
      "Contracts and agreements",
      "Asset purchase records"
    ],
    businessRelevance: "high",
    category: "Record Keeping"
  },

  // ==========================================
  // PART 11: SPECIFIC DEDUCTIONS FOR DIGITAL AGENCIES
  // ==========================================
  {
    section: "§162 Software",
    title: "Software and SaaS Deductions",
    summary: "Software subscriptions and purchases have specific tax treatment.",
    keyPoints: [
      "SaaS subscriptions: 100% deductible as ordinary business expense",
      "Purchased software: depreciate over 3 years or §179 expense",
      "Custom software development: must capitalize and amortize over 5 years (§174)",
      "Website costs: advertising is deductible, functionality may need amortization",
      "Cloud hosting: 100% deductible"
    ],
    examples: [
      "Adobe Creative Cloud - 100% deductible",
      "Vercel/AWS hosting - 100% deductible",
      "Purchased software - 3-year depreciation or §179",
      "Custom app development - 5-year amortization"
    ],
    scheduleC_line: "27a",
    businessRelevance: "high",
    category: "Tech Expenses"
  },
  {
    section: "§162 Contractors",
    title: "Contractor and Freelancer Payments",
    summary: "Payments to independent contractors are deductible business expenses with reporting requirements.",
    keyPoints: [
      "100% deductible if ordinary and necessary",
      "Must issue 1099-NEC if paid $600+ in a year",
      "Verify contractor status - misclassification penalties are severe",
      "Foreign contractors: may need 1042-S, withholding",
      "Keep contracts documenting independent relationship"
    ],
    limits: {
      "form1099Threshold": 600
    },
    examples: [
      "Freelance developer - deductible, issue 1099",
      "Design contractor - deductible, issue 1099",
      "Foreign developer - may need 30% withholding"
    ],
    scheduleC_line: "11",
    relatedForms: ["Form 1099-NEC", "Form 1042-S"],
    businessRelevance: "high",
    category: "Contractors"
  },
  {
    section: "§162 Education",
    title: "Education and Training Expenses",
    summary: "Education expenses are deductible if they maintain or improve skills in your current business.",
    keyPoints: [
      "Must relate to current business (not new career)",
      "Conferences, courses, certifications deductible",
      "Books, subscriptions, online courses deductible",
      "Travel for education follows travel rules",
      "Employee training is deductible"
    ],
    examples: [
      "Tech conferences (React Conf, etc.)",
      "Online courses (Udemy, Coursera)",
      "Professional certifications",
      "Industry publications and books"
    ],
    scheduleC_line: "27a",
    businessRelevance: "high",
    category: "Education"
  },
  {
    section: "§162 Marketing",
    title: "Advertising and Marketing Expenses",
    summary: "Advertising costs to promote business are generally 100% deductible.",
    keyPoints: [
      "Online ads (Google, Meta, LinkedIn): 100% deductible",
      "Website development: may need to capitalize",
      "Business cards, brochures: 100% deductible",
      "Sponsorships: generally deductible if business purpose",
      "Promotional items: deductible (gift limits may apply)"
    ],
    examples: [
      "Google Ads spend",
      "Facebook/Instagram advertising",
      "SEO services",
      "Content marketing services",
      "Trade show expenses"
    ],
    scheduleC_line: "8",
    businessRelevance: "high",
    category: "Marketing"
  },
  {
    section: "§162 Insurance",
    title: "Business Insurance Premiums",
    summary: "Business insurance premiums are fully deductible.",
    keyPoints: [
      "Professional liability (E&O): 100% deductible",
      "General liability: 100% deductible",
      "Cyber insurance: 100% deductible",
      "Business property insurance: 100% deductible",
      "Workers comp: 100% deductible",
      "Health insurance: see §162(l) - different rules"
    ],
    examples: [
      "Professional liability insurance",
      "General liability coverage",
      "Cyber liability/data breach insurance",
      "Business interruption insurance"
    ],
    scheduleC_line: "15",
    businessRelevance: "high",
    category: "Insurance"
  }
];

// Helper functions
export function findIRCSections(query: string): IRCSection[] {
  const lowerQuery = query.toLowerCase();
  return IRC_KNOWLEDGE_BASE.filter(section => 
    section.title.toLowerCase().includes(lowerQuery) ||
    section.summary.toLowerCase().includes(lowerQuery) ||
    section.keyPoints.some(point => point.toLowerCase().includes(lowerQuery)) ||
    section.category.toLowerCase().includes(lowerQuery) ||
    section.section.toLowerCase().includes(lowerQuery)
  );
}

export function getIRCByCategory(category: string): IRCSection[] {
  return IRC_KNOWLEDGE_BASE.filter(section => 
    section.category.toLowerCase() === category.toLowerCase()
  );
}

export function getHighRelevanceSections(): IRCSection[] {
  return IRC_KNOWLEDGE_BASE.filter(section => section.businessRelevance === 'high');
}

export function getIRCByScheduleCLine(line: string): IRCSection[] {
  return IRC_KNOWLEDGE_BASE.filter(section => 
    section.scheduleC_line?.includes(line)
  );
}

export function formatIRCForAI(): string {
  return IRC_KNOWLEDGE_BASE.map(section => 
    `## ${section.section}: ${section.title}
${section.summary}

Key Points:
${section.keyPoints.map(p => `- ${p}`).join('\n')}

${section.limits ? `Limits: ${JSON.stringify(section.limits)}` : ''}
${section.scheduleC_line ? `Schedule C Line: ${section.scheduleC_line}` : ''}
Business Relevance: ${section.businessRelevance}
`
  ).join('\n---\n');
}

export default IRC_KNOWLEDGE_BASE;
