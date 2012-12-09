function generateId(user1, user2) {
  if(user1 > user2) {
    return user1 + "-" + user2
  } else {
    return user2 + "-" + user1
  }
}

function exists(e) {
  return typeof(e) !== 'undefined' && e != null
}

try {
  exports.generateId = generateId;
  exports.exists = exists;
} catch(err) {
  //in browser
}