import { v4 as uuidv4 } from 'uuid';

const uuid = uuidv4();

export const identify = (data) => {
  window.analytics.identify(uuid, data);
};

export const track = (props, data) => {
  window.analytics.track(props, data);
};
