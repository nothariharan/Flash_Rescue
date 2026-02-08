import { motion } from 'framer-motion';
import { Package, MapPin, Phone, ExternalLink } from 'lucide-react';
import InteractiveHoverButton from '../components/ui/InteractiveHoverButton';

const resources = [
    {
        title: "Food Banks Nearby",
        description: "Locate food banks and pantries in your area offering free groceries.",
        icon: Package,
        color: "bg-orange-100 text-orange-600",
        link: "https://www.google.com/maps/search/food+banks+near+me"
    },
    {
        title: "Emergency Shelters",
        description: "Find temporary housing and emergency shelter assistance.",
        icon: MapPin,
        color: "bg-blue-100 text-blue-600",
        link: "https://www.google.com/maps/search/homeless+shelters+near+me"
    },
    {
        title: "Helplines",
        description: "24/7 support for immediate assistance and counseling.",
        icon: Phone,
        color: "bg-green-100 text-green-600",
        link: "https://findahelpline.com/"
    }
];

const ResourcesPage = () => {
    return (
        <div className="min-h-screen bg-brand-bg pt-12 px-4 pb-20">
            <div className="max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-4xl font-heading font-extrabold text-brand-text mb-4">
                        Community Resources
                    </h1>
                    <p className="text-brand-text-secondary text-lg max-w-2xl mx-auto">
                        Connect with local organizations and services dedicated to helping you.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {resources.map((resource, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white p-6 rounded-2xl shadow-sm border border-brand-border hover:shadow-md transition-shadow group"
                        >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${resource.color}`}>
                                <resource.icon size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-brand-text mb-2 group-hover:text-brand-primary transition-colors">
                                {resource.title}
                            </h3>
                            <p className="text-brand-text-secondary text-sm mb-6">
                                {resource.description}
                            </p>
                            <a href={resource.link} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm font-bold text-brand-primary hover:text-brand-primary-dark">
                                Learn More <ExternalLink size={14} className="ml-1" />
                            </a>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-12 text-center bg-brand-primary/5 rounded-3xl p-8 border border-brand-primary/10">
                    <h2 className="text-2xl font-bold text-brand-text mb-4">Need Immediate Help?</h2>
                    <p className="text-brand-text-secondary mb-6">
                        Our team is available to assist you with urgent inquiries.
                    </p>
                    <InteractiveHoverButton>
                        Contact Support
                    </InteractiveHoverButton>
                </div>
            </div>
        </div>
    );
};

export default ResourcesPage;
