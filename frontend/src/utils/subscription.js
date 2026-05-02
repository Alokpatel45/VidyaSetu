export const subscriptionIncludes = (subscription, courseId) =>
  Array.isArray(subscription) &&
  subscription.some((id) => String(id) === String(courseId));
