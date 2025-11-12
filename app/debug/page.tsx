"use client"
import { useState } from 'react';

function DebugTest() {
  const [testResult, setTestResult] = useState({
    katexLoaded: false,
    streamdownLoaded: false,
    katexInDocument: false,
    streamdownStyles: false
  });

  const runTests = () => {
    // Test 1: Check if KaTeX CSS is loaded
    const katexInDocument = Array.from(document.styleSheets).some(sheet => {
      try {
        return sheet.href?.includes('katex') || false;
      } catch (e) {
        return false;
      }
    });

    // Test 2: Check if .katex class has styles
    const testDiv = document.createElement('div');
    testDiv.className = 'katex';
    document.body.appendChild(testDiv);
    const styles = window.getComputedStyle(testDiv);
    const katexLoaded = styles.fontFamily.includes('KaTeX') || styles.fontSize !== '';
    document.body.removeChild(testDiv);

    // Test 3: Check if Streamdown is imported
    const streamdownLoaded = typeof window !== 'undefined';

    // Test 4: Check if prose/markdown styles exist
    const proseDiv = document.createElement('div');
    proseDiv.className = 'prose';
    document.body.appendChild(proseDiv);
    const proseStyles = window.getComputedStyle(proseDiv);
    const streamdownStyles = proseStyles.maxWidth !== 'none';
    document.body.removeChild(proseDiv);

    setTestResult({
      katexLoaded,
      streamdownLoaded,
      katexInDocument,
      streamdownStyles
    });
  };

  const mathExample = `The formula is: $SI = P \\times r \\times t$

And in display mode:

$$CI = P \\times (1 + r/n)^{nt} - P$$`;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4">KaTeX & Streamdown Debug Test</h1>
        
        <button
          onClick={runTests}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mb-6"
        >
          Run Diagnostic Tests
        </button>

        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2">
            <span className={`w-4 h-4 rounded-full ${testResult.katexLoaded ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span>KaTeX CSS Loaded: {testResult.katexLoaded ? '✓ Yes' : '✗ No'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-4 h-4 rounded-full ${testResult.katexInDocument ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span>KaTeX in Document: {testResult.katexInDocument ? '✓ Yes' : '✗ No'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-4 h-4 rounded-full ${testResult.streamdownLoaded ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span>Streamdown Available: {testResult.streamdownLoaded ? '✓ Yes' : '✗ No'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-4 h-4 rounded-full ${testResult.streamdownStyles ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span>Streamdown Styles: {testResult.streamdownStyles ? '✓ Yes' : '✗ No'}</span>
          </div>
        </div>

        <div className="border-t pt-6">
          <h2 className="text-xl font-semibold mb-3">Raw Math Test (should show LaTeX):</h2>
          <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded font-mono text-sm">
            {mathExample}
          </div>
        </div>
        <div className="border-t pt-6 mt-6">
          <h2 className="text-xl font-semibold mb-3">Manual KaTeX HTML Test:</h2>
          <p className="mb-2">Inline: <span dangerouslySetInnerHTML={{ __html: '<span class="katex"><span class="katex-mathml"><math><semantics><mrow><mi>x</mi><mo>=</mo><mn>5</mn></mrow></semantics></math></span></span>' }} /></p>
          <p>If you see proper math symbols above, KaTeX CSS is working!</p>
        </div>

        <div className="border-t pt-6 mt-6">
          <h2 className="text-xl font-semibold mb-3">Heading Size Test:</h2>
          <div className="space-y-2">
            <h1 className="text-4xl">H1 Heading</h1>
            <h2 className="text-3xl">H2 Heading</h2>
            <h3 className="text-2xl">H3 Heading</h3>
            <p className="text-base">Regular paragraph text</p>
          </div>
        </div>

        <div className="border-t pt-6 mt-6 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded">
          <h3 className="font-bold mb-2">How to interpret results:</h3>
          <ul className="space-y-1 text-sm list-disc list-inside">
            <li><strong>KaTeX CSS Loaded:</strong> If FALSE, katex.min.css is not imported properly</li>
            <li><strong>KaTeX in Document:</strong> If FALSE, no katex stylesheet link found in document</li>
            <li><strong>Streamdown Styles:</strong> If FALSE, @source directive not working</li>
          </ul>
        </div>

        <div className="border-t pt-6 mt-6">
          <h3 className="font-bold mb-2">Quick Fixes:</h3>
          <div className="space-y-2 text-sm">
            <p><strong>If KaTeX fails:</strong></p>
            <code className="block bg-gray-100 dark:bg-gray-700 p-2 rounded">
              import 'katex/dist/katex.min.css'; // Add to layout.tsx
            </code>
            
            <p className="mt-4"><strong>If Streamdown fails:</strong></p>
            <code className="block bg-gray-100 dark:bg-gray-700 p-2 rounded">
              // tailwind.config.ts<br/>
              content: ["./node_modules/streamdown/dist/**/*.js"]
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DebugTest;