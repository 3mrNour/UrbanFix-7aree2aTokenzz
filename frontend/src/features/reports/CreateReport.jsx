import  { useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../utils/api';
import { MapPin } from 'lucide-react';

const CreateReport = () => {
  const [coordinates, setCoordinates] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const { register, handleSubmit, formState: { isSubmitting }, reset } = useForm();

  const handleGetLocation = () => {
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoordinates([pos.coords.longitude, pos.coords.latitude]);
        setIsLocating(false);
      },
      () => {
        alert("Failed to get location.");
        setIsLocating(false);
      }
    );
  };

  const onSubmit = async (data) => {
    try {
      const formData = new FormData();
      formData.append('category', data.category);
      formData.append('description', data.description);
      formData.append('photoBefore', data.photoBefore[0]);
      
      if (coordinates) {
        formData.append('location[type]', 'Point');
        formData.append('location[coordinates][0]', coordinates[0]);
        formData.append('location[coordinates][1]', coordinates[1]);
      }

      await api.post('/reports', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      reset();
      setCoordinates(null);
      alert('Report submitted successfully!');
    } catch (error) {
      console.error(error);
      alert('Failed to submit report.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 font-sans text-[#37352f] bg-white rounded-lg border border-[#e9e9e7] shadow-sm mt-8">
      <h2 className="text-xl font-bold mb-1">Report an Issue</h2>
      <p className="text-sm text-[#787774] mb-6">Help us improve the city by reporting infrastructure problems.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select 
            {...register('category')} required
            className="w-full px-3 py-2 bg-[#f7f7f5] border border-transparent rounded-md focus:bg-white focus:border-[#2383e2] focus:ring-1 focus:ring-[#2383e2] outline-none sm:text-sm"
          >
            <option value="">Select issue type...</option>
            <option value="POTHOLE">Pothole</option>
            <option value="LIGHTING">Street Lighting</option>
            <option value="WATER_LEAK">Water Leak</option>
            <option value="GARBAGE">Garbage</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea 
            {...register('description')} required rows="3"
            className="w-full px-3 py-2 bg-[#f7f7f5] border border-transparent rounded-md focus:bg-white focus:border-[#2383e2] focus:ring-1 focus:ring-[#2383e2] outline-none sm:text-sm"
            placeholder="Add details about the issue..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Location</label>
          <div className="flex items-center gap-3">
            <button 
              type="button" onClick={handleGetLocation} disabled={isLocating}
              className="flex items-center gap-2 px-3 py-1.5 border border-[#e9e9e7] rounded-md hover:bg-[#f7f7f5] transition-colors text-sm font-medium"
            >
              <MapPin size={16} className="text-[#787774]" /> 
              {isLocating ? 'Locating...' : 'Get Coordinates'}
            </button>
            {coordinates && <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">Location Added</span>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Photo Evidence</label>
          <input 
            type="file" {...register('photoBefore')} required accept="image/*"
            className="block w-full text-sm text-[#787774] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-[#f7f7f5] file:text-[#37352f] hover:file:bg-[#e9e9e7] transition-colors cursor-pointer"
          />
        </div>

        <div className="pt-4 mt-6 border-t border-[#e9e9e7] flex justify-end">
          <button 
            type="submit" disabled={isSubmitting}
            className="bg-[#2383e2] text-white px-5 py-2 rounded-md hover:bg-[#1a65af] transition-colors text-sm font-medium disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateReport;