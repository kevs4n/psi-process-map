#!/usr/bin/env python3
"""Generate 5 template process JSON files using ProcessBuilder."""

import os
from schema import ProcessBuilder


def create_o2c():
    """Order to Cash."""
    return (
        ProcessBuilder("Order to Cash (O2C)")
        .lane("Customer")
        .lane("Sales")
        .lane("Warehouse")
        .lane("Finance")
        .step("Place Order", "Customer", type="start")
        .step("Review Order", "Sales", ado_ref="Feature-101")
        .step("Credit Check", "Finance", type="decision", ado_ref="Feature-102")
        .step("Confirm Order", "Sales", ado_ref="Feature-103")
        .step("Reject Order", "Sales", type="end")
        .step("Pick & Pack", "Warehouse", ado_ref="PBI-201")
        .step("Ship Goods", "Warehouse", ado_ref="PBI-202")
        .step("Generate Invoice", "Finance", ado_ref="Feature-104")
        .step("Payment Received?", "Finance", type="decision")
        .step("Record Payment", "Finance", ado_ref="PBI-301")
        .step("Order Complete", "Customer", type="end")
        .connect("Place Order", "Review Order")
        .connect("Review Order", "Credit Check")
        .connect("Credit Check", "Confirm Order", label="Yes")
        .connect("Credit Check", "Reject Order", label="No")
        .connect("Confirm Order", "Pick & Pack")
        .connect("Pick & Pack", "Ship Goods")
        .connect("Ship Goods", "Generate Invoice")
        .connect("Generate Invoice", "Payment Received?")
        .connect("Payment Received?", "Record Payment", label="Yes")
        .connect("Record Payment", "Order Complete")
        .auto_layout()
    )


def create_p2p():
    """Procure to Pay."""
    return (
        ProcessBuilder("Procure to Pay (P2P)")
        .lane("Requester")
        .lane("Procurement")
        .lane("Vendor")
        .lane("Accounts Payable")
        .step("Raise Requisition", "Requester", type="start", ado_ref="Feature-201")
        .step("Approve Requisition", "Procurement", type="decision")
        .step("Create PO", "Procurement", ado_ref="Feature-202")
        .step("Send PO to Vendor", "Procurement")
        .step("Deliver Goods", "Vendor")
        .step("Receive Goods", "Requester", ado_ref="PBI-210")
        .step("Three-Way Match", "Accounts Payable", type="decision", ado_ref="Feature-203")
        .step("Process Payment", "Accounts Payable", ado_ref="PBI-211")
        .step("Reject Invoice", "Accounts Payable")
        .step("Payment Complete", "Accounts Payable", type="end")
        .connect("Raise Requisition", "Approve Requisition")
        .connect("Approve Requisition", "Create PO", label="Approved")
        .connect("Create PO", "Send PO to Vendor")
        .connect("Send PO to Vendor", "Deliver Goods")
        .connect("Deliver Goods", "Receive Goods")
        .connect("Receive Goods", "Three-Way Match")
        .connect("Three-Way Match", "Process Payment", label="Match")
        .connect("Three-Way Match", "Reject Invoice", label="Mismatch")
        .connect("Process Payment", "Payment Complete")
        .auto_layout()
    )


def create_r2r():
    """Record to Report."""
    return (
        ProcessBuilder("Record to Report (R2R)")
        .lane("Accountant")
        .lane("Controller")
        .lane("GL Team")
        .lane("Reporting")
        .step("Record Transaction", "Accountant", type="start", ado_ref="Feature-301")
        .step("Post to GL", "GL Team", ado_ref="Feature-302")
        .step("Period-End Close", "GL Team", ado_ref="PBI-310")
        .step("Review Balances", "Controller", type="decision")
        .step("Adjust Entries", "Accountant", ado_ref="PBI-311")
        .step("Approve Close", "Controller")
        .step("Generate Reports", "Reporting", ado_ref="Feature-303")
        .step("Distribute Reports", "Reporting")
        .step("Reporting Complete", "Reporting", type="end")
        .connect("Record Transaction", "Post to GL")
        .connect("Post to GL", "Period-End Close")
        .connect("Period-End Close", "Review Balances")
        .connect("Review Balances", "Adjust Entries", label="Discrepancy")
        .connect("Review Balances", "Approve Close", label="OK")
        .connect("Adjust Entries", "Post to GL")
        .connect("Approve Close", "Generate Reports")
        .connect("Generate Reports", "Distribute Reports")
        .connect("Distribute Reports", "Reporting Complete")
        .auto_layout()
    )


def create_h2r():
    """Hire to Retire."""
    return (
        ProcessBuilder("Hire to Retire (H2R)")
        .lane("Candidate")
        .lane("HR")
        .lane("Manager")
        .lane("IT")
        .step("Apply", "Candidate", type="start")
        .step("Screen Application", "HR", ado_ref="Feature-401")
        .step("Interview", "Manager", type="decision")
        .step("Make Offer", "HR", ado_ref="Feature-402")
        .step("Reject", "HR", type="end")
        .step("Accept Offer", "Candidate")
        .step("Onboard Employee", "HR", ado_ref="PBI-410")
        .step("Provision Access", "IT", ado_ref="PBI-411")
        .step("Start Work", "Manager")
        .step("Onboarding Complete", "HR", type="end")
        .connect("Apply", "Screen Application")
        .connect("Screen Application", "Interview")
        .connect("Interview", "Make Offer", label="Pass")
        .connect("Interview", "Reject", label="Fail")
        .connect("Make Offer", "Accept Offer")
        .connect("Accept Offer", "Onboard Employee")
        .connect("Onboard Employee", "Provision Access")
        .connect("Provision Access", "Start Work")
        .connect("Start Work", "Onboarding Complete")
        .auto_layout()
    )


def create_seed_certification():
    """Danish Seed Certification (Froecertificering)."""
    return (
        ProcessBuilder("Froecertificering")
        .lane("Avler")
        .lane("Sortsrepresentant")
        .lane("TystofteFonden")
        .lane("Laboratorium")
        .step("Anmeld mark", "Avler", type="start", ado_ref="Feature-501")
        .step("Insend anmeldelse", "Sortsrepresentant", ado_ref="Feature-502")
        .step("Modtag anmeldelse", "TystofteFonden")
        .step("Plan marksyn", "TystofteFonden", ado_ref="PBI-510")
        .step("Udfør marksyn", "TystofteFonden", type="decision")
        .step("Godkend mark", "TystofteFonden")
        .step("Afvis mark", "TystofteFonden", type="end")
        .step("Høst froe", "Avler", ado_ref="PBI-511")
        .step("Insend proeve", "Avler")
        .step("Analysér proeve", "Laboratorium", ado_ref="Feature-503")
        .step("Kvalitet OK?", "Laboratorium", type="decision")
        .step("Udsted certifikat", "TystofteFonden", ado_ref="Feature-504")
        .step("Certificering faerdig", "Avler", type="end")
        .connect("Anmeld mark", "Insend anmeldelse")
        .connect("Insend anmeldelse", "Modtag anmeldelse")
        .connect("Modtag anmeldelse", "Plan marksyn")
        .connect("Plan marksyn", "Udfør marksyn")
        .connect("Udfør marksyn", "Godkend mark", label="Godkendt")
        .connect("Udfør marksyn", "Afvis mark", label="Afvist")
        .connect("Godkend mark", "Høst froe")
        .connect("Høst froe", "Insend proeve")
        .connect("Insend proeve", "Analysér proeve")
        .connect("Analysér proeve", "Kvalitet OK?")
        .connect("Kvalitet OK?", "Udsted certifikat", label="Ja")
        .connect("Udsted certifikat", "Certificering faerdig")
        .auto_layout()
    )


def main():
    output_dir = os.path.join(os.path.dirname(__file__), "output")
    os.makedirs(output_dir, exist_ok=True)

    templates = {
        "o2c": create_o2c,
        "p2p": create_p2p,
        "r2r": create_r2r,
        "h2r": create_h2r,
        "seed-certification": create_seed_certification,
    }

    for name, builder_fn in templates.items():
        builder = builder_fn()
        errors = builder.validate()
        if errors:
            print(f"[{name}] Validation errors:")
            for e in errors:
                print(f"  - {e}")
            continue
        path = os.path.join(output_dir, f"{name}.json")
        builder.to_json(path)
        print(f"Generated: {path}")


if __name__ == "__main__":
    main()
