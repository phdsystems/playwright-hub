import React from 'react';

// Component with no data-testid attributes
export default function NoTestIds() {
  return (
    <div>
      <button onClick={() => console.log('clicked')}>
        Click Me
      </button>

      <input
        type="text"
        name="username"
        placeholder="Username"
      />

      <a href="/about">About Us</a>

      <select onChange={(e) => console.log(e.target.value)}>
        <option value="1">Option 1</option>
        <option value="2">Option 2</option>
      </select>

      <textarea
        name="message"
        placeholder="Your message"
        onBlur={() => {}}
      />
    </div>
  );
}
