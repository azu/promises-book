var myString = ['Open','Your','Dev','Tools!']
  , anotherString
  , header = document.createElement('h1')
  , msg = document.createElement('p');

anotherString = myString.join(' ');

header.innerHTML = anotherString;
document.body.appendChild(header);

msg.innerHTML = 'Do you see this? Great! Too bad this isn\'t actually the test.<br /><br />Open your dev tools and see if an "entry.js" file is there. If so, the actual test suceeded.<br /><br /><em>Remember to turn on source maps in your options!</em>';
document.body.appendChild(msg);
