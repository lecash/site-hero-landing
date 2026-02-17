const fs = require('fs');
const path = require('path');

console.log('Running tests...\n');

let passed = 0;
let failed = 0;

function test(description, fn) {
    try {
        fn();
        console.log(`✓ ${description}`);
        passed++;
    } catch (error) {
        console.log(`✗ ${description}`);
        console.log(`  Error: ${error.message}`);
        failed++;
    }
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

// Test 1: Check if index.html exists
test('index.html file exists', () => {
    const indexPath = path.join(__dirname, 'index.html');
    assert(fs.existsSync(indexPath), 'index.html should exist');
});

// Test 2: Check if styles.css exists
test('styles.css file exists', () => {
    const stylesPath = path.join(__dirname, 'styles.css');
    assert(fs.existsSync(stylesPath), 'styles.css should exist');
});

// Test 3: Check if index.html contains required elements
test('index.html contains hero section', () => {
    const indexPath = path.join(__dirname, 'index.html');
    const content = fs.readFileSync(indexPath, 'utf-8');
    assert(content.includes('class="hero"'), 'index.html should contain a hero section');
});

// Test 4: Check if index.html contains features section
test('index.html contains features section', () => {
    const indexPath = path.join(__dirname, 'index.html');
    const content = fs.readFileSync(indexPath, 'utf-8');
    assert(content.includes('id="features"'), 'index.html should contain features section');
});

// Test 5: Check if index.html is valid HTML5
test('index.html has valid HTML5 doctype', () => {
    const indexPath = path.join(__dirname, 'index.html');
    const content = fs.readFileSync(indexPath, 'utf-8');
    assert(content.startsWith('<!DOCTYPE html>'), 'index.html should start with HTML5 doctype');
});

// Test 6: Check if styles.css contains hero styles
test('styles.css contains hero styles', () => {
    const stylesPath = path.join(__dirname, 'styles.css');
    const content = fs.readFileSync(stylesPath, 'utf-8');
    assert(content.includes('.hero'), 'styles.css should contain hero styles');
});

// Test 7: Check if index.html links to styles.css
test('index.html links to styles.css', () => {
    const indexPath = path.join(__dirname, 'index.html');
    const content = fs.readFileSync(indexPath, 'utf-8');
    assert(content.includes('href="styles.css"'), 'index.html should link to styles.css');
});

// Test 8: Check if index.html has proper meta viewport
test('index.html has viewport meta tag', () => {
    const indexPath = path.join(__dirname, 'index.html');
    const content = fs.readFileSync(indexPath, 'utf-8');
    assert(content.includes('name="viewport"'), 'index.html should have viewport meta tag');
});

console.log(`\n${passed + failed} tests completed`);
console.log(`✓ ${passed} passed`);
if (failed > 0) {
    console.log(`✗ ${failed} failed`);
    process.exit(1);
} else {
    console.log('\nAll tests passed!');
    process.exit(0);
}
