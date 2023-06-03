// helper function to create html elements
function createElem(tag, attrs = {}, ...children) {
  const newElement = document.createElement(tag);
  Object.keys(attrs).forEach((key) => {
    newElement.setAttribute(key, attrs[key]);
  });

  children.forEach((child) => {
    newElement.append(child);
  });
  return newElement;
}
export default createElem;
