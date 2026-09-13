yield: "2 servings of each"
time: "15 min"

ingredients:
  - { id: butter, item: "Butter", amount: "1 tablespoon" }
  - { id: shallot, item: "Shallot", amount: "½", note: "Finely diced" }
  - { id: peppercorns, item: "Peppercorns", amount: "½ tablespoon", note: "Lightly crushed" }
  - { id: all-purpose-flour, item: "All-purpose flour", amount: "½¼ tablespoons" }
  - { id: brandy, item: "Brandy", amount: "1 tablespoon" }
  - { id: whole-milk, item: "Whole milk", amount: "⅜ cup", note: "Can thin with more as needed" }
  - { id: heavy-cream, item: "Heavy cream", amount: "⅛ cup" }
  - { id: beef-broth, item: "Beef broth", amount: "⅓ cup" }
  - { id: worcestershire, item: "Worcestershire", amount: "½–1 teaspoon", note: "Check for gluten if needed" }
  - { id: salt, item: "Salt", amount: "To taste" }
  - { id: refined-coconut-oil-or-neutral-oil, item: "Refined coconut oil or neutral oil", amount: "1 tablespoon", note: "Add a splash of olive oil for flavor" }
  - { id: potato-flour-or-potato-starch, item: "Potato flour or potato starch", amount: "½¼ tablespoons" }
  - { id: peppercorns-2, item: "Peppercorns", amount: "½ tablespoon", note: "Lightly crushed" }
  - { id: shallot-2, item: "Shallot", amount: "½", note: "Finely diced" }
  - { id: brandy-2, item: "Brandy", amount: "1 tablespoon" }
  - { id: unsweetened-cashew-or-barista-oat-milk, item: "Unsweetened cashew or barista oat milk", amount: "½ cup", note: "Start with ¾ cup, reserve ¼ cup to thin" }
  - { id: beef-broth-2, item: "Beef broth", amount: "⅓ cup", note: "Gluten-free" }
  - { id: gluten-free-worcestershire, item: "Gluten-free Worcestershire", amount: "½–1 teaspoon" }
  - { id: salt-2, item: "Salt", amount: "To taste" }

steps:
  - id: v1_1
    in: [butter, shallot, peppercorns]
    do: "lightly crush"
    for: "3–4 min"
    detail: "Lightly crush the peppercorns using a rolling pin or mortar and pestle, leaving some coarse bits for texture. In a saucepan over medium heat, melt the butter and sauté the diced shallots until translucent, about 3–4 minutes."
    phase: "Classic (with dairy and wheat flour)"
  - id: v1_2
    in: [v1_1, all-purpose-flour, brandy]
    do: "stir in the flour"
    for: "1–2 min"
    detail: "Stir in the flour and cook, stirring constantly, for about 1 minute to make a roux. Do not let it brown. Add the brandy, cooking 1–2 minutes to let the alcohol evaporate."
    phase: "Classic (with dairy and wheat flour)"
  - id: v1_3
    in: [v1_2, whole-milk, heavy-cream, beef-broth, worcestershire, salt]
    do: "gradually whisk"
    for: "3–5 min"
    detail: "Gradually whisk in the milk and cream, stirring constantly to avoid lumps. Cook until slightly thickened. Add beef broth, crushed peppercorns, Worcestershire, and salt. Simmer gently for 3–5 minutes until the sauce is glossy and coats the back of a spoon (nappe)."
    phase: "Classic (with dairy and wheat flour)"
  - id: v1_4
    in: [v1_3]
    do: "adjust seasoning"
    detail: "Adjust seasoning to taste and serve immediately."
    phase: "Classic (with dairy and wheat flour)"
    title: "Classic (with dairy and wheat flour)"
  - id: v2_1
    in: [refined-coconut-oil-or-neutral-oil, peppercorns-2, potato-flour-or-potato-starch]
    do: "lightly crush"
    detail: "Lightly crush the peppercorns using a rolling pin or mortar and pestle, leaving some coarse pieces. Warm the refined coconut oil or neutral oil with a bit of olive oil in a saucepan over medium heat."
    phase: "Dairy-free & wheat-free version"
  - id: v2_2
    in: [v2_1, shallot-2]
    do: "add diced shallots"
    for: "3–4 min"
    detail: "Add diced shallots and cook until translucent, 3–4 minutes. Sprinkle in potato flour and stir constantly for about 1 minute. Do not brown it, or it may turn gluey."
    phase: "Dairy-free & wheat-free version"
  - id: v2_3
    in: [v2_2, brandy-2, unsweetened-cashew-or-barista-oat-milk]
    do: "add the brandy and cook"
    for: "1–2 min"
    detail: "Add the brandy and cook for 1–2 minutes to evaporate alcohol, scraping the bottom of the pan. Gradually whisk in about 6 tbsp of the plant milk, whisking until smooth and thickened."
    phase: "Dairy-free & wheat-free version"
  - id: v2_4
    in: [v2_3, beef-broth-2, gluten-free-worcestershire, salt-2]
    do: "add beef broth"
    for: "3–5 min"
    detail: "Add beef broth, crushed peppercorns, Worcestershire, and salt. Simmer 3–5 minutes until glossy and nappe. Adjust the thickness with the remaining plant milk or a splash of broth. Taste and adjust salt and pepper before serving."
    phase: "Dairy-free & wheat-free version"
    title: "Dairy-free & wheat-free version"
