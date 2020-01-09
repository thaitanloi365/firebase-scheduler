export interface IDevice {
  token: string;
  platform: "iOS" | "Android";
  user_id: number;
}
export interface INotification {
  user_id: number;
  title: string;
  body: string;
  payload: Object;
  icon: string;
  created_at: number;
  updated_at: number;
  id: number;
}

export interface IFailure {
  device: IDevice;
  notification: INotification;
  is_sent: boolean;
  retry_times: number;
  message_id?: string;
}
