import { randomUUID } from 'node:crypto';
import { runWithContext } from '../context/context.js';

function requestContext(req, res, next) {
  const initialContext = {
    requestId: randomUUID(),
    startTimeMs: Date.now(),
    req,
    res,
    user: null,
  };

  runWithContext(initialContext, () => next());
}

export default requestContext;


