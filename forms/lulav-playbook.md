# Lulav & Etrog order form - build playbook (ChabadOne form builder)

**Already built on page 7511371.** To apply the 2026-09-15 changes (prices
$75 / $100 / $150, set cards, no delivery, the "Fancier set - my budget" box)
run `forms/update-lulav-form.js` in the builder console and Save. The steps
below are for building from scratch.

The Lulav form is a native ChabadOne form (the site's own processor, the CRM
keeps the orders). Three files in this folder do the work:

| File | What it is |
|---|---|
| `forms/inject-lulav.js` | Console script that builds every field in the form builder. Nothing saves until you click Save. |
| `forms/lulav-receipt.html` | One-line branded receipt / on-screen response paste (teal + orange Sukkot palette). |
| this file | The steps. |

## 0. Set the prices first

Open `inject-lulav.js` and edit the `PRICES` block at the top. The values in
the file are the confirmed prices (Standard $75, Deluxe $100, Premium $150):

```
standard: 75     Set quantity - Standard   (per set)
deluxe:  100     Set quantity - Deluxe     (per set)
premium: 150     Set quantity - Premium    (per set)
fancierMin: 150  "Fancier set - my budget": buyer types the amount ($150+), charged 1:1
donations: 18, 36, 54, 100, 180
```

The intro text and the field sub-labels are generated from the same block, so
changing a number there changes it everywhere.

## 1. Create the page

1. In the ChabadOne admin, add a new page of the same type as the High Holiday
   seats form (`/546190`, a form page). Title it **Lulav & Etrog Sets**.
2. Note the page's article id (the number in the URL). That id is what the
   Sukkot landing page links to; send it back so the landing card can point at it.
3. Open the page in the **form builder** (leave the canvas empty).

## 2. Run the script

1. Press **F12**, Console tab.
2. In the context dropdown at the top of the console (it says `top`), pick the
   frame whose name mentions **formbuilder** or **chabadone.org**. The script
   checks for the builder's own functions and refuses to run in the wrong frame.
3. Chrome blocks pasting at first: type `allow pasting` and press Enter.
4. Paste the whole contents of `inject-lulav.js`, press Enter, confirm the
   dialog (it shows the form id it is about to build).
5. The canvas rebuilds. Read the console report (one line per field), look the
   form over, then click the admin's **Save** button.

Re-running on a built form aborts on purpose ("already has Set quantity - Standard").

## 3. After saving

1. Open the **Payment** field's payment wizard and confirm the credit card
   processor is selected (the script sets processor index 0; verify).
2. **Form Settings -> Response / Receipt**: paste the contents of
   `lulav-receipt.html` into the custom message box. It must stay ONE line (the
   admin warns about line breaks). Subject:
   `Your Lulav & Etrog Set Reservation - Chabad in South Beach`
   The same box is the on-screen thank-you and the emailed receipt.
3. **Form Settings -> Notifications**: set the office email that gets each order.
4. Test: submit one order with quantity 1 on the cheapest set and refund it, or
   submit with all quantities blank plus a $18 donation. Check the receipt
   arrives, the total was right, and the CRM entry lists the fields.

## What the receipt shows

The receipt repeats one row per **non-empty** submitted field, using the field
label as the row name. That is why:

- the labels are short and self-explanatory ("Deluxe set", "Fancier set - my budget");
- quantity fields left blank simply do not appear (a family ordering one Deluxe
  set sees one quantity row, not three);
- the donation dropdown has no "none" option: untouched means omitted;
- the fancier-set box, when left blank, does not appear either.

## Field list (as built)

| Label | Type | Pricing | Required |
|---|---|---|---|
| Lulav & Etrog Sets 5787 | heading | | |
| (intro text with set options, pickup, order-by date) | text | | |
| Standard set | number (card: name, price + description sub-label, quantity) | price per item = 75 | no |
| Deluxe set | number (card) | price per item = 100 | no |
| Premium set | number (card) | price per item = 150 | no |
| Fancier set - my budget | number | price per item = 1 (charges the typed amount), min 150 | no |
| Your Information | heading | | |
| Full Name | full name | | yes |
| Email | email | | yes |
| Phone | phone | | yes |
| Would you like to add a donation? | dropdown $18 / $36 / $54 / $100 / $180 | 18 / 36 / 54 / 100 / 180 | no |
| Notes | textarea | | no |
| Payment | heading | | |
| Total | total amount | | |
| Payment | payform (credit card, processor 0) | | |
| Order My Set | submit button | | |

No conditions: pickup only, no address field.

## Why quantities are number fields, not dropdowns

The builder's "price per item" property (quantity times price) lives on the
Number field, the same control the live membership form uses for its priced
"Number of Children". A Dropdown can only price each option at a fixed amount.
The one control literally named Quantity is a campaign control the builder
limits to one per form, so it cannot serve three set types.

## 4. Link it

Send back the new page's article id. The Sukkot landing page (aid 7511266) gets
a "Lulav & Etrog Sets" card pointing at it, and the Sukkot schedule page gets a
link too.
