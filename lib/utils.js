'use strict';

export function toCamelCase (string) {
  var parts = string.split('_');
  var capitalized = parts.map(function (part, idx) {
    if (idx > 0) {
      return capitalizeFirstLetter(part);
    }

    return part;
  });

  return capitalized.join('');
}

export function capitalizeFirstLetter (string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export function alphaNumOnly (string) {
  return  string.replace(/[^a-zA-Z0-9]/gi, '');
}

module.exports = {
  toCamelCase: toCamelCase,
  capitalizeFirstLetter: capitalizeFirstLetter,
  alphaNumOnly: alphaNumOnly
};
