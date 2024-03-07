export function reformatString(input) {
  let parts = input.split("-"); // Split the string by '-'
  let timestamp = parts[0]; // Extract timestamp
  let words = parts.slice(1); // Extract the remaining words
  let capitalizedWords = words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)); // Capitalize each word
  return timestamp + " " + capitalizedWords.join(" "); // Combine them with a space
}
