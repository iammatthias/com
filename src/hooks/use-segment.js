export const identify = (data) => {
  window.analytics.identify(data);
};

export const track = (props, data) => {
  window.analytics.track(props, data);
};
