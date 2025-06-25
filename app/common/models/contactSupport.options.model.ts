import { Schema, model } from 'mongoose';

interface IContactSupportOptions {
  title: string;
  createdBy: string;
  timestamp: Date;
  status: boolean;
}

const contactSupportOptionsSchema = new Schema({
  title: {
    type: String,
    required: true,	
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: Boolean,
    default: true,
  },
   timestamp: {
    type: Date,
    default: Date.now,
  },
});


export const ContactSupportOptions = model<IContactSupportOptions>('ContactSupportOptions', contactSupportOptionsSchema);





