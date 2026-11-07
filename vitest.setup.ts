import '@testing-library/jest-dom/vitest';
import { configure } from '@testing-library/react';

// findBy*/waitFor give up after this long: generous under parallel load, instant when the condition holds.
configure({ asyncUtilTimeout: 5000 });
